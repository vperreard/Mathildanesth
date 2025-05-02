## Roadmap Consolidée Mathildanesth (Avec Priorités P1-P4)

**Objectif Général :** Livrer une application de planning robuste, performante, sécurisée et répondant aux besoins spécifiques de l'équipe d'anesthésie.

---

### Phase 1 : Refactorisation Critique & Fondations Solides (Durée estimée : 3 semaines + 1 tampon)

**Objectif :** Stabiliser la base de code, améliorer la maintenabilité, la performance et la fiabilité des composants et systèmes clés. Poser des fondations saines.

*   **(P1)** ✅ Refactorisation du composant `Header`.
*   **(P1)** ✅ Mise en place/Refactorisation d'un système de **validation des dates robuste** et centralisé.
*   **(P1)** ✅ Amélioration significative de la **gestion globale des erreurs** (logging systématique via `errorLoggingService`, messages utilisateurs clairs, stratégies de récupération, `ErrorBoundary` React).
*   **(P1)** ✅ Refactorisation du module/composants `Leaves` (gestion des congés).
*   **(P1)** ✅ Finalisation de la logique de validation, décompte et gestion des conflits pour les congés.
*   **(P1)** ✅ Implémentation du système proactif d'alerte de conflits potentiels avec détection précoce des périodes à risque.
*   **(P1)** ✅ Implémentation du système de trames de planning avec affectations configurables.
*   **(P1)** ✅ Système de validation, duplication et exportation des trames.
*   **(P1)** ✅ Intégration du module de trames avec le module de planning.
*   **(P1)** 🔄 Implémentation de **tests unitaires** (Jest) pour tous les composants/fonctions refactorisés (Objectif couverture ≥ 70%).
*   **(P1)** 🔄 Refactorisation du module/composants `Calendar`.
*   **(P1)** 🔄 Division des composants majeurs refactorisés en sous-composants réutilisables et plus simples.
*   **(P1)** 🔄 Amélioration de la gestion des états (cohérence, éviter mutations directes, cf. `patterns-antipatterns.md`).
*   **(P1)** 🔄 Feedback visuel immédiat pour les interactions utilisateur critiques (chargement, succès, erreur).
*   **(P1)** Validation interne (tests utilisateurs, revue de code) et corrections.
*   **(P1)** Mise à jour de la documentation technique (`codebase-overview.md`, `data-flow.md`) reflétant l'architecture refactorisée.
*   **(P2)** Établir des métriques de performance baseline pour les composants clés.
*   **(P3)** Mettre en place/Utiliser **Storybook** pour documenter et tester les composants UI refactorisés.
*   **(P3)** Améliorer/Implémenter un système de notification basique pour les actions clés (ex: approbation congé).

**Livrables Clés Phase 1 :** Code base stable, composants clés testés, gestion des congés fonctionnelle, documentation technique à jour, base solide pour les fonctionnalités.

---

### Phase 2 : Planification MVP & Fonctionnalités Prioritaires (Durée estimée : 2 mois + 2 semaines tampon)

**Objectif :** Livrer un premier module de planification fonctionnel (gardes/astreintes), incluant les règles de base, la gestion des remplacements et un premier algorithme, ainsi que des outils d'analyse basiques.

*   **(P1)** Développement du module de **règles dynamiques (MVP)** : 
    - ✅ Structure de base avec types et interfaces
    - ✅ Service du moteur de règles implémenté
    - ✅ Composants d'édition et de liste des règles
    - 🔄 interface admin simple (CRUD) 
    - 🔄 moteur pour règles de base (répartition gardes)
*   **(P1)** Implémentation de la gestion des **indisponibilités** utilisateurs.
*   **(P1)** Interface de **validation/modification manuelle** des plannings.
*   **(P1)** Développement d'un système de **remplacements** / gestion des imprévus.
*   **(P1)** Développement de l'**algorithme de génération** des plannings (Version 1, focus sur règles de base).
*   **(P1)** Tests d'intégration des règles et de l'algorithme.
*   **(P1)** Lancement d'une **phase Bêta** avec utilisateurs clés et collecte structurée des retours.
*   **(P1)** Corrections prioritaires basées sur les retours Bêta.
*   **(P2)** Mise en place d'un **tableau de bord analytique basique** (ex: répartition heures, taux de remplacement).
*   **(P2)** Documentation utilisateur initiale pour les fonctionnalités de planification.
*   **(P2)** Gestion détaillée des **profils utilisateurs** (Préférences spécifiques MAR/IADE, temps de travail personnalisé).
*   **(P3)** Gestion des **jours fériés** (configurable).
*   **(P3)** Implémentation d'une fonctionnalité simple d'**échange/permutation** de gardes entre médecins.

**Livrables Clés Phase 2 :** Module planification gardes/astreintes (MVP) opérationnel, Algorithme V1 fonctionnel, Analytics basiques, Version Bêta testée.

---

### Phase 3 : Améliorations UX, Consultations & Collaboration (Durée estimée : 2 mois + 2 semaines tampon)

**Objectif :** Raffiner l'expérience utilisateur, rendre l'application pleinement utilisable sur mobile (web responsive), livrer un MVP du module de consultations et améliorer la collaboration.

*   **(P1)** Améliorations **UX prioritaires** : 
    - ✅ système de filtrage avancé (`AdvancedFilter.tsx`)
    - ✅ feedback visuel amélioré via transitions fluides (`transitions/index.ts`)
    - ✅ optimisation des requêtes avec hook personnalisé (`useOptimizedQuery.ts`)
    - ✅ mise en cache cohérente des données (`CacheService.ts`)
    - 🔄 recherche performante
*   **(P1)** Adaptation **responsive complète** de l'interface web pour une expérience optimale sur tablettes et mobiles.
*   **(P2)** Développement du module de **planification des consultations (MVP)** : gestion créneaux, règles répartition simples, intégration planning/congés.
*   **(P2)** Tests utilisateurs dédiés aux améliorations UX et au module consultations.
*   **(P2)** Vérifications et corrections d'**accessibilité** (WCAG).
*   **(P3)** Implémentation de fonctionnalités de **collaboration** : messagerie contextuelle simple, commentaires/annotations sur planning, historique modifications basique.
*   **(P3)** Début des vérifications de conformité **RGPD**.
*   **(P4)** Mise en place d'un système de **thème** (Clair/Sombre).
*   **(P4)** Implémentation de l'authentification **2FA** (si non faite avant et si jugée nécessaire à ce stade).

**Livrables Clés Phase 3 :** Interface optimisée et responsive, Module consultations (MVP), Documentation utilisateur mise à jour.

---

### Phase 4 : Module Bloc Opératoire, Finalisation & Déploiement (Durée estimée : 2 mois + 2 semaines tampon)

**Objectif :** Compléter l'application avec le module bloc opératoire, assurer la sécurité et la performance, et préparer le déploiement en production.

*   **(P1)** **Audit de sécurité** complet et corrections.
*   **(P1)** **Optimisations de performance** finales (backend, frontend, requêtes base de données).
*   **(P1)** Mise en place de stratégies de **cache avancé**.
*   **(P1)** **Tests de charge** pour simuler l'utilisation réelle.
*   **(P1)** Finalisation de la **documentation** complète (technique et utilisateur).
*   **(P1)** Préparation technique au **déploiement** : stratégie, plan migration, setup monitoring/alerting, plan support.
*   **(P1)** **Formation** des utilisateurs clés/référents.
*   **(P2)** 🔄 Développement du module de **planification du bloc opératoire (MVP)** : définition salles/secteurs, règles supervision simples, interface planning bloc V1.
*   **(P3)** Complétion du module **bloc opératoire** : intégration Google Sheets (si confirmé), trame hebdo, règles avancées, simulation, annotations.
*   **(P3)** Amélioration du module **Analytics** : indicateurs avancés (QoL, équité), rapports personnalisés.
*   **(P3)** Création du **matériel de formation** détaillé.

**Livrables Clés Phase 4 :** Module bloc opératoire (MVP+), Application sécurisée et performante, Documentation finale, Utilisateurs clés formés, Application prête pour production.

---

### Phase 5 : Applications Mobiles Natives & Évolutions Futures (Durée estimée : 3 mois + 3 semaines tampon)

**Objectif :** Fournir des applications mobiles natives pour un accès facilité et envisager les évolutions futures et intégrations.

*   **(P2)** Développement de l'**application mobile native React Native (MVP)** : consultation planning/congés, notifications push.
*   **(P3)** Complétion de l'**application mobile native** : fonctionnalités étendues, mode hors-ligne, optimisations UI/UX mobile.
*   **(P3)** **Intégrations** avec d'autres systèmes hospitaliers (si requis et priorisé).
*   **(P4)** Fonctionnalités avancées d'Analytics (prédictions, etc.).
*   **(P4)** Nouvelles fonctionnalités basées sur les retours post-déploiement.

**Livrables Clés Phase 5 :** Applications mobiles natives (iOS/Android), Intégrations externes (si applicable).

---

### Amélioration Continue (En parallèle de toutes les phases)

*   **(P1)** **Corrections de bugs** critiques et bloquants découverts.
*   **(P1)** **Monitoring** performance et erreurs en continu.
*   **(P2)** **Mise à jour régulière de la documentation** technique et utilisateur.
*   **(P2)** Extension progressive de la **couverture de tests** unitaires et d'intégration.
*   **(P2)** Revue et mise à jour des **dépendances** (sécurité, versions).
*   **(P3)** **Optimisations de performance** incrémentales.
*   **(P3)** **Améliorations mineures** basées sur les retours continus.
*   **(P4)** **Revue régulière des logs** et des métriques d'utilisation.

---

**Note Importante :** Cette roadmap consolidée met fortement l'accent sur la **Phase 1 : Refactorisation Critique**. Il est essentiel de la mener à bien avant de s'engager pleinement dans les phases suivantes pour garantir la qualité et la pérennité du projet. Les durées sont indicatives et la roadmap devrait être revue régulièrement.

**Statut actuel :** Nous avons avancé sur plusieurs tâches de la Phase 1 et commençons à travailler sur le développement du module de planification du bloc opératoire (Phase 4) en parallèle, tout en continuant l'implémentation des tests unitaires et la refactorisation du module Calendar.

---

*Dernière mise à jour: Mai 2025*