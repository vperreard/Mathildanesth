### Évolutions du Module de Gestion des Congés

#### Court Terme (Ex: Prochain Sprint / Cycle de développement)

*   **Fiabilisation du Calcul des Soldes de Congés**:
    *   Intégration complète du calcul des jours `acquis` dans l'API des soldes (`/api/leaves/balance`) après investigation du modèle de données pour les ajustements.
    *   Stabilisation du modèle `LeaveBalance` (validation de sa structure et fiabilisation de ses processus de mise à jour).
*   **Augmentation Significative de la Couverture de Tests (Module `leaves`)**:
    *   Objectif : > 80% de couverture pour les services et hooks critiques.
    *   Finalisation des tests unitaires pour `useLeaveCalculation`, `LeaveForm`, `conflictDetectionService`.
    *   Mise en place de tests d'intégration pour les workflows clés de demande et de gestion des congés.
    *   Résolution des problèmes de configuration Jest/TypeScript.
*   **Améliorations UX pour le Formulaire de Demande de Congés**:
    *   Meilleure gestion et affichage des erreurs.
    *   Retours visuels améliorés lors des interactions.

#### Moyen Terme (Ex: Trimestre Suivant)

*   **Gestion Avancée des Quotas et Droits**:
    *   Développement ou consolidation de règles d'acquisition automatique de congés (ex: acquisition mensuelle, par ancienneté).
    *   Interface d'administration dédiée pour les ajustements manuels de soldes.
*   **Système de Notifications Amélioré**:
    *   Notifications plus riches et configurables pour les demandes de congés, les approbations, et les alertes de solde bas.
*   **Optimisation des Performances**:
    *   Revue des requêtes de base de données liées aux congés et aux soldes.
    *   Affinement des stratégies de mise en cache.

#### Long Terme (Ex: Prochains 6-12 Mois)

*   **Intégration Poussée avec un Calendrier d'Équipe Interactif**:
    *   Visualisation avancée des congés de l'équipe, des conflits potentiels, et des disponibilités.
*   **Fonctionnalités de Prévision et Simulation de Solde**:
    *   Permettre aux utilisateurs de simuler l'impact d'une future demande de congé sur leur solde.
*   **Support de Politiques de Congés Plus Complexes et Configurables**:
    *   Gestion du Compte Épargne Temps (CET).
    *   Congés spécifiques par ancienneté, rôle, ou accords d'entreprise.
    *   Workflows d'approbation multi-niveaux pour certains types de congés. 