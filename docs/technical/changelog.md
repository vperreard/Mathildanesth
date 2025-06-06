# Changelog

## [Non versionné] - État actuel

### Ajouté
- **Système de validation de dates centralisé** :
  - Intégration du hook `useDateValidation` dans le module Leaves et Calendar.
  - Validation standardisée des dates avec gestion des erreurs consistante.
  - Support de validation pour les jours fériés, weekends et périodes spéciales.
- **Intégration du système centralisé de validation des dates dans le module Leaves**:
  - Création d'un hook personnalisé `useLeaveValidation` qui étend `useDateValidation` avec des fonctionnalités spécifiques aux congés.
  - Intégration du hook dans le composant `LeaveRequestForm` pour une validation centralisée et robuste des demandes de congés.
  - Ajout de tests unitaires pour le hook `useLeaveValidation` assurant le bon fonctionnement de la validation des dates de congés.
- **Unification du type `ShiftType`** :
  - Création d'un type unifié dans `src/types/common.ts` pour centraliser la définition.
  - Ajout de constante `SHIFT_DURATION` pour standardiser les durées des shifts.
- **Tests unitaires pour le module `leaves`** :
  - Couverture ajoutée pour `leaveService.ts`.
  - Couverture ajoutée pour `leaveCalculator.ts`.
  - Couverture ajoutée pour `useLeave.ts`.
  - Couverture ajoutée pour `useConflictDetection.ts`.
  - Couverture ajoutée pour le nouveau hook `useLeaveListFilteringSorting.ts`.
  - **Améliorations des tests du composant `LeavesList`** :
    - Tests robustes pour la gestion des propriétés null/undefined des utilisateurs.
    - Vérification du comportement avec des objets utilisateurs incomplets ou manquants.
    - Tests améliorés pour la fonctionnalité de tri et filtrage.
    - Tests pour les cas limites comme les dates invalides et les objets congés non définis.
- Système de trames d'affectation
  - Création de trames récurrentes
  - Gestion des périodes (hebdo, bi-hebdo, mensuel)
  - Validation des conflits
  - Intégration avec le planning
- Gestion des utilisateurs
  - Authentification JWT
  - Gestion des rôles (ADMIN, MANAGER, USER)
  - Profils utilisateurs
  - Gestion des préférences
- Génération de planning
  - Application des trames
  - Détection des conflits
  - Filtrage par utilisateur/date
  - Optimisation automatique
  - Simulation et validation
- Gestion des congés
  - Demande et validation
  - Calcul automatique des jours
  - Gestion des soldes
  - Détection des conflits
- Calendrier
  - Vue personnelle et collective
  - Filtres avancés
  - Export des données
- Dashboard
  - Widgets personnalisables
  - Statistiques en temps réel
  - Visualisation des données
- Documentation
  - Guide utilisateur
  - Documentation technique
  - Interface de consultation
- Moteur de règles
  - Règles métier configurables
  - Validation des contraintes
  - Résolution automatique des conflits
- Système de notification
  - Alertes en temps réel
  - Centre de notifications
  - Notifications par email
- **Système de notification pour les conflits de congés** :
  - Service `LeaveConflictNotificationService` pour générer et envoyer des notifications personnalisées pour chaque type de conflit.
  - Hook `useLeaveConflictNotification` qui s'intègre avec `useConflictDetection` et fournit des méthodes pour afficher des notifications visuelles.
  - Composant `LeaveConflictAlert` pour afficher les conflits avec le style approprié selon leur sévérité (information, avertissement, bloquant).
  - Support pour les actions sur les conflits (ignorer, résoudre, etc.).
  - Intégration complète avec le formulaire de demande de congés pour une meilleure expérience utilisateur.
- **Système de détection de conflits pour les congés** :
  - Service `conflictDetectionService.ts` qui implémente l'analyse des conflits potentiels dans les demandes de congés.
  - Types et interfaces dans `types/conflict.ts` pour standardiser la gestion des conflits.
  - Niveaux de sévérité configurables (information, avertissement, bloquant).
  - Règles personnalisables pour adapter la détection aux besoins spécifiques.
  - Intégration avec les services de gestion d'équipe et d'utilisateur pour les vérifications contextuelles.
- **Système de rapport analytique pour les conflits de congés** :
  - Service `LeaveConflictAnalyticsService` pour collecter des statistiques sur les conflits et générer des rapports d'analyse.
  - Hook `useLeaveConflictAnalytics` pour récupérer, filtrer et manipuler les données d'analyse des conflits.
  - Composant `LeaveConflictDashboard` pour visualiser les données avec graphiques et tableaux.
  - Page dédiée aux analyses dans l'interface d'administration (`/admin/conges/analytics`).
  - Fonctionnalités avancées de filtrage par département, période et type de congé.
  - Génération de recommandations automatiques pour optimiser la planification des congés.
  - Export des rapports au format CSV.

### Modifié
- **Amélioration du hook `useConflictDetection`** :
  - Intégration de la validation de dates avec le hook `useDateValidation`.
  - Amélioration de la gestion d'erreurs avec messages détaillés.
  - Optimisation du cycle de vie des états (réinitialisation des états pour les nouveaux appels).
  - Contrôle de validité des paramètres avant appel API pour éviter les erreurs silencieuses.
- **Mise à jour des tests d'intégration du module planning** :
  - Correction des références à l'ancienne énumération `ShiftType` (MORNING → MATIN).
  - Ajout des valeurs manquantes dans les objets de configuration des tests.
  - Adaptation des temps de départ et fin des shifts selon la nouvelle typologie.
- **Correction des erreurs TypeScript dans les tests de `useConflictDetection`** :
  - Ajout de types explicites pour éviter les erreurs "implicitly has an 'any' type".
  - Correction du typage de la variable `promise` en `Promise<any>`.
  - Amélioration de la fonction `createDate` avec des types explicites.
- **Refactorisation du service de congés `leaveService.ts`** :
  - Amélioration de la gestion des erreurs API avec `response.json().catch()`.
  - Standardisation du format des dates envoyées via `formatDate()`.
  - Simplification des fonctions utilitaires comme `getLeaveTypeLabel()`.
  - Adaptation pour utiliser le type `ShiftType` unifié.
  - Réécriture de `calculateLeaveDays()` pour simplifier la logique.
- **Refactoring du composant `LeavesList.tsx`** :
  - Extraction de la logique de tri et de filtrage dans le hook réutilisable `useLeaveListFilteringSorting.ts`.
  - Simplification du composant `LeavesList` qui gère désormais l'état de tri/filtre localement.
- Optimisation des performances
- Amélioration de la structure du projet
- Mise à jour des dépendances
- Refactorisation des services
- Amélioration de l'interface utilisateur
- Mise à jour de la documentation

### Corrigé
- **Correction des erreurs TypeScript dans les tests** :
  - Résolution des erreurs "implicitly has an 'any' type" dans les tests de `useConflictDetection`.
  - Correction des références à l'ancienne énumération `ShiftType` dans les tests d'intégration du module planning.
- **Correction des tests du module de congés** :
  - Adaptation des tests aux changements de format de date et de gestion d'erreurs.
  - Correction des attentes de test pour matcher les nouveaux formats d'URL et de payload.
  - Amélioration des assertions pour rendre les tests plus robustes.
- Correction des conflits d'affectation
- Amélioration de la gestion des erreurs
- Correction des problèmes d'affichage
- Résolution des problèmes de synchronisation
- Optimisation des requêtes de base de données
- fix(leaves): Correction du type de date (Date vs string) passé à checkLeaveConflicts depuis useLeave.

### Bug Fixes

- Résolution des erreurs silencieuses dans les hooks de gestion des congés
- Correction de l'affichage des erreurs de validation de dates
- Standardisation de la gestion des dates invalides à travers l'application
- Mise à jour des tests du LeaveRequestForm pour refléter l'utilisation du nouveau hook useLeaveValidation

## [0.1.0] - 2024-03-20

### Ajouté
- Structure initiale du projet
- Composants UI de base
- Configuration de la base de données
- Système d'authentification
- Modèles de données principaux

## Instructions pour la mise à jour

Pour mettre à jour cette documentation lorsque vous implémentez de nouvelles fonctionnalités :

1. Dans `docs/technical/codebase-overview.md` :
   - Ajouter les nouveaux composants, services ou modules
   - Mettre à jour les interfaces et types
   - Documenter les nouvelles fonctionnalités
   - Ajouter les points d'attention spécifiques

2. Dans `docs/technical/changelog.md` :
   - Créer une nouvelle entrée non versionnée ou versionnée
   - Documenter les ajouts, modifications et corrections
   - Inclure les détails techniques pertinents
   - Mettre à jour les instructions si nécessaire

3. Pour référencer ces fichiers dans vos demandes :
   - Demander la lecture des fichiers au début de chaque conversation
   - Vérifier les fonctionnalités existantes avant d'implémenter du code
   - Demander une mise à jour de la documentation après chaque implémentation importante

## Versions

### v0.9.5 (XX Juin 2024)

- Documentation
  - ✅ Mise à jour de `codebase-overview.md` avec documentation détaillée du générateur de planning
  - ✅ Mise à jour de `data-flow.md` avec le flux de données du générateur de planning
  - ✅ Mise à jour de `patterns-antipatterns.md` avec les problèmes de définition de types identifiés
  - ✅ Documentation du problème de divergence entre les définitions de `ShiftType`

- Refactorisation
  - ✅ Unification des définitions de `ShiftType` dans un fichier commun `src/types/common.ts`
  - ✅ Mise à jour des imports de `ShiftType` dans tous les fichiers du projet
  - ✅ Adaptation du code pour utiliser la nouvelle définition unifiée
  - ✅ Amélioration de la gestion d'erreurs dans les hooks du module Leaves

- Correctifs
  - ✅ Correction des tests unitaires défaillants dans leaveService
  - ✅ Correction des erreurs TypeScript dans les tests de useConflictDetection
  - ✅ Mise à jour des références de ShiftType dans les tests d'intégration du module planning
  - ✅ Amélioration de la validation des dates avec useDateValidation

### v0.9.4 (21 Mai 2024)

## Version 1.4.0 (à venir)

### Ajouts et améliorations
- **Intégration du système centralisé de validation des dates dans le module Leaves**
  - Implémentation du hook personnalisé `useLeaveValidation` qui étend les fonctionnalités de `useDateValidation` spécifiquement pour les congés.
  - Intégration complète dans le composant `LeaveRequestForm` pour une validation robuste des demandes de congés.
  - Validation des dates avec gestion centralisée des erreurs et affichage contextuel.
  - Support pour la validation des quotas de congés disponibles.
- **Tests unitaires complets**
  - Tests exhaustifs pour le hook `useLeaveValidation` couvrant tous les cas de validation.
  - Vérification des cas limites (dates passées, plages invalides, dépassement de quotas).
- **Gestion des erreurs**
  - Amélioration de la capture et de l'affichage des erreurs pour une meilleure expérience utilisateur.
  - Messages d'erreur spécifiques selon le type d'erreur de validation de date.
- **Intégration du hook `useDateValidation` dans les composants `LeaveRequestForm`**
  - Support pour la validation de contraintes métier (préavis minimum, quotas, etc.)

### Corrections de bugs
- Correction des erreurs silencieuses dans les hooks de gestion des congés
- Correction de l'affichage des erreurs de validation des dates
- Standardisation de la gestion des dates invalides dans toute l'application 