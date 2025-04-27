# Refactorisation du Module de Gestion des Congés

## Présentation générale

Cette documentation décrit la refactorisation du composant de gestion des congés (Leaves) dans l'application Mathildanesth, réalisée conformément à la Phase 1 de la roadmap. Cette refactorisation vise à améliorer l'organisation du code, la gestion d'état et les performances.

## Architecture

### Structure de répertoires

```
src/modules/leaves/
  ├── components/          # Composants UI
  │   ├── LeaveCard.tsx    # Carte individuelle pour chaque congé
  │   ├── LeaveForm.tsx    # Formulaire de création/édition
  │   ├── LeavesList.tsx   # Liste des congés
  │   └── ...
  ├── hooks/               # Hooks personnalisés
  │   ├── useLeave.ts      # Hook pour la gestion d'un congé
  │   └── useConflictDetection.ts # Hook pour la détection des conflits
  ├── services/            # Services et logique métier
  │   ├── leaveService.ts  # Service principal pour les congés
  │   └── notificationService.ts # Service de notification
  ├── store/               # Gestion de l'état global
  │   └── leaveStore.ts    # Store Zustand pour les congés
  ├── types/               # Types et interfaces
  │   ├── leave.ts         # Types pour les congés
  │   └── conflict.ts      # Types pour la gestion des conflits
  └── utils/               # Utilitaires
      └── dateUtils.ts     # Fonctions de manipulation de dates
```

### Séparation des responsabilités

La refactorisation a mis l'accent sur une séparation claire des responsabilités :

1. **Composants UI** : Responsables uniquement de l'affichage et des interactions utilisateur
2. **Store global** : Gestion centralisée de l'état avec Zustand
3. **Services** : Logique métier et interactions avec l'API
4. **Hooks** : Logique réutilisable et communication entre les composants et les services
5. **Types** : Définitions de types pour garantir la sécurité du typage

## Fonctionnalités principales

### 1. Soumission des demandes de congés

- Interface utilisateur simplifiée pour la création de demandes
- Validation des saisies en temps réel
- Prévisualisation du nombre de jours décomptés
- Support de tous les types de congés

### 2. Validation et décompte

- Calcul automatique des jours décomptés selon le planning de l'utilisateur
- Prise en compte des jours fériés, weekends et temps partiels
- Vérification automatique du solde de congés disponible
- Prévention des demandes excédant le solde disponible

### 3. Gestion des conflits

- Détection automatique des conflits avec d'autres congés
- Affichage des avertissements lors de la création/modification
- Interface dédiée pour les gestionnaires de planning

### 4. Système de notification

- Notifications en temps réel pour les approbations/rejets
- Notifications pour les conflits potentiels
- Rappels pour les congés à venir
- Alertes pour les gestionnaires de planning

## Flux de travail

### Création d'une demande de congé

1. L'utilisateur remplit le formulaire de demande
2. Le système vérifie en temps réel le solde disponible
3. Le système détecte les éventuels conflits avec d'autres congés
4. La demande est soumise et enregistrée en statut "En attente"
5. Une notification est envoyée aux approbateurs concernés

### Approbation/Rejet d'une demande

1. L'approbateur reçoit une notification
2. Il peut approuver ou rejeter la demande
3. Le solde de congés de l'utilisateur est mis à jour (si approuvé)
4. Une notification est envoyée à l'utilisateur concerné

## Améliorations techniques

### Performances

- Utilisation de `React.memo` pour éviter les rendus inutiles
- Optimisation des listes avec `useMemo` et `useCallback`
- Pagination côté serveur pour les longues listes de congés
- Mise en cache des données fréquemment utilisées

### Gestion d'état

- Migration vers Zustand pour une gestion d'état plus simple et performante
- Architecture basée sur des slices pour séparer les différentes parties de l'état
- Persistance sélective des préférences utilisateur
- Actions optimisées pour réduire les rendus inutiles

### Interface utilisateur

- Composants réutilisables et modulaires
- Animations fluides avec Framer Motion
- Design responsive adapté aux mobiles, tablettes et ordinateurs
- Accessibilité améliorée (ARIA, navigation au clavier)

## Tests

Des tests complets ont été mis en place pour assurer la qualité et la stabilité du code :

- Tests unitaires pour les composants UI
- Tests unitaires pour la logique métier
- Tests d'intégration pour les flux complets
- Tests de performances pour les fonctionnalités critiques

## Prochaines étapes

Pour la Phase 2 de la refactorisation, les axes d'amélioration suivants sont envisagés :

1. Ajout de fonctionnalités avancées de planification
2. Intégration avec le calendrier de l'établissement
3. Amélioration du système de notification
4. Interface de reporting pour les responsables RH
5. Support pour les règles métier complexes (gardes, astreintes) 