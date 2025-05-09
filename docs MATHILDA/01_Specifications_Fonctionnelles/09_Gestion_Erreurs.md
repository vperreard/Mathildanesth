# 9. Gestion des Erreurs et Exceptions

Ce document décrit comment l'application gérera les erreurs et les situations exceptionnelles pour fournir une expérience utilisateur cohérente et aider au débogage.

## 9.1 Types d'Erreurs

*   **Erreurs de Validation (Frontend/Backend) :** Données invalides soumises via des formulaires (champs manquants, format incorrect, etc.).
*   **Erreurs Métier (Backend) :** Violation des règles métier lors d'une opération (ex: tentative de valider un congé créant un sous-effectif critique, génération de planning impossible pour une journée, conflit d'affectation).
*   **Erreurs d'Autorisation (Backend) :** Tentative d'accès à une ressource ou d'exécution d'une action sans les permissions nécessaires.
*   **Erreurs Serveur (Backend) :** Problèmes inattendus côté serveur (erreur base de données, bug non géré, service externe indisponible).
*   **Erreurs Réseau/Communication :** Problèmes de communication entre le frontend et le backend.

## 9.2 Stratégie de Gestion

*   **Validation Côté Frontend :** Validation immédiate dans les formulaires pour guider l'utilisateur avant soumission.
*   **Validation Côté Backend :** Double validation systématique côté serveur pour assurer l'intégrité des données.
*   **Messages d'Erreur Clairs (Utilisateur) :**
    *   Afficher des messages compréhensibles expliquant le problème et, si possible, comment le corriger.
    *   Pour les erreurs métier (ex: génération impossible), fournir un maximum de contexte (jour concerné, règle violée).
    *   Utiliser des composants UI cohérents (ex: toasts, alertes inline) pour afficher les erreurs.
*   **Codes de Statut HTTP Appropriés (API) :**
    *   `400 Bad Request` pour les erreurs de validation.
    *   `401 Unauthorized` pour les problèmes d'authentification.
    *   `403 Forbidden` pour les problèmes d'autorisation.
    *   `404 Not Found` pour les ressources non trouvées.
    *   `409 Conflict` pour les conflits métier (ex: doublon).
    *   `422 Unprocessable Entity` pour les erreurs de validation sémantique (règles métier).
    *   `500 Internal Server Error` pour les erreurs serveur génériques.
*   **Logging Détaillé (Backend) :**
    *   Enregistrer toutes les erreurs serveur (avec stack trace complète, contexte de la requête).
    *   Enregistrer les erreurs métier importantes pour analyse.
    *   Utiliser des niveaux de log (INFO, WARN, ERROR, DEBUG).
*   **Gestion des Erreurs Inattendues (Frontend) :** Prévoir un mécanisme (ex: Error Boundary dans React) pour capturer les erreurs JavaScript inattendues et afficher un message générique à l'utilisateur, tout en logguant l'erreur pour les développeurs.

## 9.3 Exemples de Gestion Spécifique

*   **Génération de Planning Impossible :**
    *   L'algorithme doit identifier les jours/personnes posant problème et les règles spécifiques violées.
    *   L'interface doit clairement indiquer les jours non planifiés ou en conflit, avec une explication.
    *   Proposer des actions (ex: modifier les contraintes, affecter manuellement).
*   **Conflit de Congés :**
    *   Lors de la demande : avertir si la période est déjà tendue.
    *   Lors de la validation : refuser si le seuil d'absents est dépassé, avec message explicatif.

Ce système vise à rendre l'application robuste et facile à utiliser, même en cas de problème. 