# 6. Historique et Audit

Pour assurer la traçabilité des actions importantes et faciliter la résolution de problèmes, MATHILDA intégrera un système d'historique et d'audit.

## 6.1 Événements Audités

Les actions suivantes (liste non exhaustive) devront être enregistrées :

*   **Gestion du Planning :**
    *   Création d'une version de planning.
    *   Publication d'une version de planning.
    *   Archivage d'une version de planning.
    *   Création d'une affectation.
    *   Modification d'une affectation (avec détails avant/après si possible).
    *   Suppression d'une affectation.
    *   Validation d'un échange d'affectation.
*   **Gestion des Congés :**
    *   Soumission d'une demande de congé.
    *   Validation d'une demande de congé.
    *   Refus d'une demande de congé.
    *   Annulation d'une demande de congé.
*   **Gestion des Utilisateurs :**
    *   Création d'un utilisateur.
    *   Modification des informations d'un utilisateur (rôle, temps travail, etc.).
    *   Activation/Désactivation d'un utilisateur.
*   **Gestion de la Configuration :**
    *   Modification d'un paramètre système.
    *   Modification d'une règle métier (planification, configuration).
*   **Gestion des Droits :**
    *   Changement de rôle d'un utilisateur.
    *   Modification des permissions d'un rôle.

## 6.2 Informations Enregistrées

Pour chaque événement audité, les informations suivantes devront être stockées :

*   **Timestamp :** Date et heure exactes de l'événement.
*   **Utilisateur :** Identifiant de l'utilisateur ayant effectué l'action.
*   **Action :** Type d'action effectuée (ex: `PLANNING_PUBLISHED`, `LEAVE_APPROVED`, `USER_UPDATED`).
*   **Entité Cible :** Type d'entité concernée (ex: `PlanningVersion`, `Leave`, `User`).
*   **ID Entité Cible :** Identifiant de l'entité spécifique concernée.
*   **Détails (Optionnel) :** Informations supplémentaires, comme les valeurs avant/après pour une modification (peut être stocké en JSON).
*   **Adresse IP (Optionnel) :** Adresse IP source de la requête.

## 6.3 Consultation de l'Historique

*   Une interface administrateur (`super_admin`) permettra de consulter et de filtrer les logs d'audit (par date, utilisateur, type d'action, entité).
*   Pour certaines actions (ex: modifications sur une affectation spécifique), un historique simplifié pourrait être visible directement dans l'interface utilisateur concernée.

## 6.4 Implémentation Technique

*   Une table dédiée `audit_logs` sera créée pour stocker ces informations.
*   L'enregistrement des logs pourra se faire via des décorateurs, des middlewares au niveau de l'API, ou des triggers de base de données pour les actions critiques.
*   Une attention particulière sera portée à la performance et au volume de stockage des logs (politique de rétention/archivage à définir). 