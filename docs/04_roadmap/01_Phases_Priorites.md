# Phases et Priorités de Développement

## Approche de priorisation

Le développement de Mathildanesth suit une approche de priorisation à quatre niveaux :

- **P1** : Critique pour le fonctionnement de base - Doit être implémenté en priorité
- **P2** : Important pour l'expérience utilisateur complète - À implémenter après P1
- **P3** : Fonctionnalités d'amélioration - À développer quand les P1 et P2 sont stables
- **P4** : Nice-to-have - Dernières priorités de développement

## État actuel (Juin 2025)

Nous sommes actuellement en phase de finalisation du module bloc opératoire et de stabilisation des tests. Le thème sombre a été complètement implémenté à travers l'application.

### Modules Complétés (✅)

- Système de gestion des congés
- Système de validation des dates robuste et centralisé
- Gestion globale des erreurs
- Système d'alerte de conflits potentiels
- Système de trames de planning
- Découplage Client/Serveur pour les principaux modules
- Implémentation du thème sombre

### Modules En Cours (🔄)

- Module de règles dynamiques (MVP)
- Interface de planning hebdomadaire (amélioration drag & drop)
- Tests unitaires et d'intégration (stabilisation)
- Division des composants majeurs en sous-composants

## Plan par Phases

### Phase 1 : Refactorisation Critique & Fondations Solides (Échéance : T2 2025)

**Objectif :** Stabiliser la base de code, améliorer la maintenabilité, la performance et la fiabilité des composants et systèmes clés.

**État :** Principalement complété

**Tâches restantes :**
- **(P1)** Finalisation des tests unitaires (Jest) pour tous les composants refactorisés
- **(P1)** Validation interne et corrections
- **(P1)** Mise à jour de la documentation technique reflétant l'architecture refactorisée
- **(P2)** Établir des métriques de performance baseline pour les composants clés

### Phase 2 : Planification MVP & Fonctionnalités Prioritaires (Échéance : T4 2025)

**Objectif :** Livrer un premier module de planification fonctionnel (gardes/astreintes), incluant les règles de base, la gestion des remplacements et un premier algorithme.

**État :** En cours

**Tâches en cours/à venir :**
- **(P1)** Finalisation du module de règles dynamiques (MVP)
- **(P1)** Implémentation de la gestion des indisponibilités utilisateurs
- **(P1)** Interface de validation/modification manuelle des plannings
- **(P1)** Développement d'un système de remplacements / gestion des imprévus
- **(P1)** Développement de l'algorithme de génération des plannings (Version 1)
- **(P1)** Tests d'intégration des règles et de l'algorithme
- **(P1)** Lancement d'une phase Bêta avec utilisateurs clés

### Phase 3 : Améliorations UX, Consultations & Collaboration (Échéance : T2 2026)

**Objectif :** Raffiner l'expérience utilisateur, rendre l'application pleinement utilisable sur mobile (web responsive), livrer un MVP du module de consultations et améliorer la collaboration.

**État :** Planifié

**Principales tâches :**
- **(P1)** Adaptation responsive complète de l'interface web
- **(P2)** Développement du module de planification des consultations (MVP)
- **(P2)** Tests utilisateurs dédiés aux améliorations UX
- **(P2)** Vérifications et corrections d'accessibilité (WCAG)
- **(P3)** Implémentation de fonctionnalités de collaboration

### Phase 4 : Stabilisation et Tests Approfondis (Échéance : T3-T4 2026)

**Objectif :** Finaliser le module bloc opératoire, stabiliser l'application et préparer pour production.

**État :** Partiellement en cours

**Principales tâches :**
- **(P1)** Finalisation du module bloc opératoire
- **(P1)** Tests de performance approfondis
- **(P1)** Tests d'accessibilité
- **(P1)** Corrections bugs et optimisations
- **(P2)** Documentation utilisateur complète

### Phase 5 : Applications Mobiles Natives & Évolutions Futures (Échéance : 2027)

**Objectif :** Fournir des applications mobiles natives pour un accès facilité et envisager les évolutions futures et intégrations.

**État :** Planifié

**Principales tâches :**
- **(P2)** Développement de l'application mobile native React Native (MVP)
- **(P3)** Complétion de l'application mobile native
- **(P3)** Intégrations avec d'autres systèmes hospitaliers
- **(P4)** Fonctionnalités avancées d'Analytics

## Prochaines étapes immédiates (T3 2025)

1. Finalisation du module bloc opératoire
   - Interface planning bloc V1
   - Tests et documentation

2. Développement du module de règles dynamiques
   - Moteur de règles avancé
   - Intégration avec l'algorithme de génération

3. Gestion des indisponibilités et validations
   - Système d'indisponibilités utilisateurs
   - Interface de validation/modification manuelle des plannings

4. Correction des bugs critiques identifiés
   - Calcul des jours ouvrables et jours fériés
   - Performance du tableau de bord analytique 