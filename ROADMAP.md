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

| Fonctionnalité                        | Statut | Détails / Modules Concernés                                                                                                                           |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gestion des Utilisateurs & Accès**  | ✅     | Authentification, profils (MAR/IADE), rôles de base. (`src/app/auth`, `src/modules/profiles`)                                                         |
| **Gestion des Congés & Absences**     | 🔄     | Demandes, validation, décompte, quotas (`useLeaveQuota`), gestion des conflits de base, API `/api/leaves/balance`. (`src/modules/leaves`)             |
| **Système de Règles Dynamiques**      | 🔄     | Moteur de règles (`RuleEngineService`), structure de base, validation, détection conflits (moteur). (`src/modules/dynamicRules`, `src/modules/rules`) |
| **Calendrier & Affichage Planning**   | ✅     | Affichage des affectations, jours fériés, navigation. (`src/modules/calendar`, `src/app/calendar`)                                                    |
| **Gestion des Trames de Planning**    | ✅     | Création, édition de modèles de planning (ex: bloc opératoire). (`src/app/parametres/trames`, `EditActivityModal`, `BlocPlanningTemplateEditor`)      |
| **Paramétrage de Base**               | ✅     | Gestion des sites, secteurs, salles, spécialités, types de congés. (`src/app/admin`, `src/app/parametres`)                                            |
| **Gestion des Erreurs & Logging**     | ✅     | `errorLoggingService`, `ErrorBoundary`.                                                                                                               |
| **Tests Unitaires & Intégration**     | 🔄     | Couverture en augmentation continue (Jest, MSW).                                                                                                      |
| **Thème Sombre**                      | ✅     | Implémentation complète.                                                                                                                              |
| **Drag & Drop Planning Hebdomadaire** | ✅     | Pour les affectations, avec validation par le moteur de règles.                                                                                       |
| **Outils de Simulation Planning**     | 🔄     | Module de simulation fonctionnel avec création, exécution et visualisation des résultats (`src/app/admin/simulations`), export PDF/Excel.             |

---

## Phase 2 : Planification Avancée & Bloc Opératoire (Prochaines Étapes Majeures)

| Fonctionnalité                                  | Statut | Détails / Modules Concernés                                                                                                                                                           |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Algorithme de Génération Planning**           | 🔄     | V1 pour gardes/astreintes, focus sur règles de base.                                                                                                                                  |
| **Planification du Bloc Opératoire**            | 🔄     | Gestion affichage salles/secteurs par `displayOrder`, intégration trames, affectations. (`src/app/bloc-operatoire`, `src/app/planning/hebdomadaire`)                                  |
| **Amélioration Interfaces Trames/Affectations** | ⏳     | Refonte UI pour création/édition trames, affectations plus visuelles et intuitives, gestion simplifiée des variations.                                                                |
| **Gestion des Indisponibilités**                | ✅     | Module `src/modules/unavailability` fonctionnel.                                                                                                                                      |
| **Validation Manuelle Plannings**               | 🔄     | Interfaces pour ajustements manuels.                                                                                                                                                  |
| **Simulation Avancée de Planning**              | 🔄     | Templates de simulation, comparaison de scénarios, dashboard analytique (`src/app/admin/simulations`).                                                                                |
| **Gestion des Remplacements**                   | ⏳     | Système pour gérer les imprévus et remplacements.                                                                                                                                     |
| **Échanges d'Affectations**                     | 🔄     | Fonctionnalité simple d'échange (lié à `add_assignment_swap_request` migration).                                                                                                      |
| **Interface Admin Règles Avancée**              | 🔄     | Amélioration `RuleForm`, `RuleList`.                                                                                                                                                  |
| **Améliorations Gestion Disponibilités**        | ⏳     | Expression des préférences utilisateurs, visibilité anticipée des impacts d'absence, vue consolidée des disponibilités (voir `docs-consolidated/04_Roadmap/02_Axes_Amelioration.md`). |

---

## Phase 3 : UX, Collaboration & Fonctionnalités Complémentaires

| Fonctionnalité                         | Statut | Détails / Modules Concernés                                                                                                                            |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Améliorations UX Générales**         | ✅     | Filtres avancés (`AdvancedFilter.tsx`), transitions (`transitions/index.ts`), requêtes optimisées (`useOptimizedQuery.ts`), cache (`CacheService.ts`). |
| **Design Responsive Complet**          | 🔄     | Adaptation continue pour tablettes et mobiles.                                                                                                         |
| **Planification des Consultations**    | ⏳     | Module dédié (MVP) : gestion créneaux, règles simples.                                                                                                 |
| **Outils de Collaboration**            | ⏳     | Messagerie contextuelle, commentaires sur planning, historique.                                                                                        |
| **Tableaux de Bord & Analytics (V1)**  | 🔄     | Affichage de premières statistiques (`src/app/statistiques`, `src/modules/dashboard`, `src/modules/analytics`). Migration `add_dashboard`.             |
| **Système de Notifications Avancé**    | 🔄     | Module `src/modules/notifications`, migration `add_notifications`.                                                                                     |
| **Gestion Avancée des Disponibilités** | ⏳     | Alertes proactives, gestion des exceptions, tableaux de bord d'équité.                                                                                 |
| **Assistant IA pour Simulation**       | ⏳     | Analyses automatiques et suggestions d'amélioration basées sur les résultats de simulation.                                                            |

---

## Phase 4 : Finalisation & Déploiement

| Fonctionnalité                       | Statut | Détails                                             |
| ------------------------------------ | ------ | --------------------------------------------------- |
| **Tests Approfondis**                | 🔄     | Performance, Sécurité (RGPD), Accessibilité (WCAG). |
| **Optimisation des Performances**    | 🔄     | Base de données, API, frontend.                     |
| **Documentation Utilisateur Finale** | ⏳     | Guides complets pour tous les rôles.                |
| **Préparation au Déploiement**       | ⏳     | Scripts, configuration serveur, etc.                |

---

## Phase 5 : Évolutions Futures

| Fonctionnalité                      | Statut | Détails                                                           |
| ----------------------------------- | ------ | ----------------------------------------------------------------- |
| **Applications Mobiles Natives**    | ⏳     | React Native (MVP : consultation planning/congés, notifications). |
| **Intégrations Externes**           | ⏳     | Avec d'autres systèmes hospitaliers (si besoin).                  |
| **Analytics Avancés & Prédictions** | ⏳     | Fonctionnalités d'analyse prédictive, IA.                         |

---

_Cette roadmap est un document vivant et sera mise à jour régulièrement en fonction de l'avancement et des priorités._
