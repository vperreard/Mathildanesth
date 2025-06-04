# API Design (REST)

Ce document décrit la conception de l'API REST pour MATHILDA. L'API est le point de communication entre le frontend React et le backend Node.js/Express.

## Principes Généraux

*   **Format :** JSON
*   **Authentification :** JWT (JSON Web Tokens) via des cookies HTTP-only sécurisés (géré par NextAuth.js côté client et une vérification middleware côté serveur).
*   **Autorisation :** Basée sur les rôles et potentiellement les permissions fines définies dans la table `roles`. Un middleware vérifiera les droits pour chaque endpoint sensible.
*   **Conventions de Nommage :**
    *   Endpoints : Pluriel, kebab-case (ex: `/api/v1/planning-assignments`)
    *   Champs JSON : camelCase (ex: `utilisateurId`)
*   **Gestion des Erreurs :** Utilisation des codes de statut HTTP appropriés (400, 401, 403, 404, 422, 500) et d'un format d'erreur JSON standardisé :
    ```json
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Des erreurs de validation sont survenues.",
        "details": [ { "field": "email", "message": "Format invalide" } ]
      }
    }
    ```
*   **Pagination :** Pour les listes potentiellement longues (utilisateurs, affectations), utiliser la pagination basée sur les paramètres `page` et `pageSize` (ou `limit`/`offset`).
*   **Versioning :** `/api/v1/`
*   **Spécification Formelle :** La spécification détaillée et formelle de l'API est maintenue au format **OpenAPI 3.0 (YAML)** dans le fichier `docs/02_Architecture_Technique/04_API_Specification.yaml`. L'objectif est de **générer automatiquement** ce fichier à partir du code source backend (via annotations/décorateurs) pour garantir sa mise à jour.

## Endpoints Principaux

### Authentification (`/api/auth/...`)

*Gérés principalement par NextAuth.js, mais le backend devra fournir les callbacks nécessaires.* 

*   `POST /api/auth/callback/credentials` : Connexion par email/mot de passe.
*   `GET /api/auth/session` : Récupérer les informations de la session utilisateur.
*   `POST /api/auth/signout` : Déconnexion.
*   ... (autres endpoints NextAuth.js selon les fournisseurs activés)

### Utilisateurs (`/api/v1/utilisateurs`)

*   `GET /api/v1/utilisateurs` : Lister les utilisateurs (avec filtres: rôle, nom...). (Admin)
    *   Query Params: `role`, `search`, `page`, `pageSize`
*   `POST /api/v1/utilisateurs` : Créer un nouvel utilisateur. (Super Admin)
*   `GET /api/v1/utilisateurs/me` : Récupérer les informations de l'utilisateur connecté.
*   `GET /api/v1/utilisateurs/{userId}` : Récupérer les détails d'un utilisateur spécifique. (Admin)
*   `PUT /api/v1/utilisateurs/{userId}` : Mettre à jour un utilisateur. (Admin pour les autres, utilisateur pour son propre profil limité)
*   `DELETE /api/v1/utilisateurs/{userId}` : Désactiver un utilisateur. (Super Admin)
*   `GET /api/v1/utilisateurs/{userId}/skills` : Lister les compétences d'un utilisateur.
*   `POST /api/v1/utilisateurs/{userId}/skills` : Assigner une compétence à un utilisateur. (Admin)
*   `PUT /api/v1/utilisateurs/{userId}/skills/{skillId}` : Modifier le niveau/préférence d'une compétence. (Admin)
*   `DELETE /api/v1/utilisateurs/{userId}/skills/{skillId}` : Retirer une compétence. (Admin)
*   `GET /api/v1/utilisateurs/{userId}/counters` : Récupérer les compteurs d'équité d'un utilisateur.
    *   Query Params: `periodType`, `startDate`, `endDate`
*   `PUT /api/v1/utilisateurs/{userId}/counters` : **Modifier manuellement un compteur initial.** (Admin) - *Nécessaire pour l'initialisation sans migration.*
*   `GET /api/v1/utilisateurs/{userId}/preferences` : Récupérer les préférences d'un utilisateur. (Utilisateur pour soi-même, Admin pour les autres)
*   `PUT /api/v1/utilisateurs/{userId}/preferences` : Mettre à jour les préférences d'un utilisateur. (Utilisateur pour soi-même, Admin pour les autres)
    *   Body: `{ defaultView?, theme?, notificationPreferences?, timezone? ... }`

### Planning / Affectations (`/api/v1/planning-assignments`)

*   `GET /api/v1/planning-assignments` : Récupérer les affectations pour une période donnée.
    *   Query Params: `startDate`, `endDate`, `userId`, `roomId`, `sectorId`, `type`, `versionId` (pour voir une version spécifique)
    *   Réponse : Liste d'affectations incluant les détails de l'utilisateur, salle, secteur, type...
*   `POST /api/v1/planning-assignments/generate` : Lancer la génération automatique d'un planning pour une période. (Admin MAR)
    *   Body: `{ startDate, endDate }`
    *   Réponse : Potentiellement un ID de tâche asynchrone si la génération est longue.
*   `GET /api/v1/planning-assignments/generation/{taskId}` : Vérifier le statut d'une tâche de génération.
*   `POST /api/v1/planning-assignments` : Créer une affectation manuelle. (Admin)
*   `PUT /api/v1/planning-assignments/{assignmentId}` : Modifier une affectation existante. (Admin)
*   `DELETE /api/v1/planning-assignments/{assignmentId}` : Supprimer une affectation. (Admin)

### Congés (`/api/v1/conges`)

*   `GET /api/v1/conges` : Lister les demandes de congés (les siennes ou toutes pour admin).
    *   Query Params: `userId`, `status`, `startDate`, `endDate`
*   `POST /api/v1/conges` : Soumettre une demande de congé.
*   `GET /api/v1/conges/{leaveId}` : Voir les détails d'une demande.
*   `PUT /api/v1/conges/{leaveId}` : Modifier sa propre demande (si `pending`).
*   `DELETE /api/v1/conges/{leaveId}` : Annuler sa propre demande (si `pending`).
*   `POST /api/v1/conges/{leaveId}/approve` : Approuver une demande (Admin).
*   `POST /api/v1/conges/{leaveId}/reject` : Rejeter une demande (Admin).

### Trame Chirurgien (`/api/v1/surgeon-schedule`)

*   `GET /api/v1/surgeon-schedule` : Consulter la trame pour une période.
    *   Query Params: `startDate`, `endDate`, `roomId`, `surgeonId`
*   `POST /api/v1/surgeon-schedule/import` : Importer la trame depuis une source (ex: CSV). (Admin, Secrétaire)
*   ... (potentiellement CRUD pour gérer manuellement les entrées)

### Configuration (`/api/v1/config`)

*   `GET /api/v1/config/parametres` : Récupérer les paramètres généraux configurables. (Admin)
*   `PUT /api/v1/config/parametres` : Modifier des paramètres. (Super Admin)
*   `GET /api/v1/config/penibilite` : Récupérer la configuration des points de pénibilité. (Admin)
*   `PUT /api/v1/config/penibilite` : Modifier la configuration des points. (Super Admin)

*   **Sites:**
    *   `GET /api/v1/config/sites` : Lister les sites. (Admin)
    *   `POST /api/v1/config/sites` : Créer un site. (Super Admin)
    *   `GET /api/v1/config/sites/{siteId}` : Voir un site. (Admin)
    *   `PUT /api/v1/config/sites/{siteId}` : Modifier un site. (Super Admin)
    *   `DELETE /api/v1/config/sites/{siteId}` : Supprimer un site. (Super Admin)

*   **Secteurs:**
    *   `GET /api/v1/config/sectors` : Lister les secteurs (optionnel: filtrer par siteId). (Admin)
        *   Query Params: `siteId`
    *   `POST /api/v1/config/sectors` : Créer un secteur. (Super Admin)
    *   `GET /api/v1/config/sectors/{sectorId}` : Voir un secteur. (Admin)
    *   `PUT /api/v1/config/sectors/{sectorId}` : Modifier un secteur. (Super Admin)
    *   `DELETE /api/v1/config/sectors/{sectorId}` : Supprimer un secteur. (Super Admin)
    *   `PUT /api/v1/config/sectors/reorder` : Réorganiser l'ordre des secteurs pour un site. (Super Admin)
        *   Body: `{ siteId: number, orderedSectorIds: number[] }`

*   **Salles:**
    *   `GET /api/v1/config/rooms` : Lister les salles (optionnel: filtrer par sectorId). (Admin)
        *   Query Params: `sectorId`
    *   `POST /api/v1/config/rooms` : Créer une salle. (Super Admin)
    *   `GET /api/v1/config/rooms/{roomId}` : Voir une salle. (Admin)
    *   `PUT /api/v1/config/rooms/{roomId}` : Modifier une salle (y compris son `sectorId` pour la déplacer). (Super Admin)
    *   `DELETE /api/v1/config/rooms/{roomId}` : Supprimer une salle. (Super Admin)
    *   `PUT /api/v1/config/rooms/reorder` : Réorganiser l'ordre des salles pour un secteur. (Super Admin)
        *   Body: `{ sectorId: number, orderedRoomIds: number[] }`

*   **Types d'Affectation:**
    *   `GET /api/v1/config/assignment-types` : Lister les types d'affectation. (Admin)
    *   `POST /api/v1/config/assignment-types` : Créer un type. (Super Admin)
    *   `PUT /api/v1/config/assignment-types/{typeId}` : Modifier un type. (Super Admin)
    *   `DELETE /api/v1/config/assignment-types/{typeId}` : Supprimer un type. (Super Admin)

*   **Compétences:**
    *   `GET /api/v1/config/skills` : Lister les compétences. (Admin)
    *   `POST /api/v1/config/skills` : Créer une compétence. (Super Admin)
    *   `PUT /api/v1/config/skills/{skillId}` : Modifier une compétence. (Super Admin)
    *   `DELETE /api/v1/config/skills/{skillId}` : Supprimer une compétence. (Super Admin)

*   **Spécialités:**
    *   `GET /api/v1/config/specialties` : Lister les spécialités. (Admin)
    *   `POST /api/v1/config/specialties` : Créer une spécialité. (Super Admin)
    *   `PUT /api/v1/config/specialties/{specialtyId}` : Modifier une spécialité. (Super Admin)
    *   `DELETE /api/v1/config/specialties/{specialtyId}` : Supprimer une spécialité. (Super Admin)

*   **Types de Congés:**
    *   `GET /api/v1/config/leave-types` : Lister les types de congés configurés. (Admin)
    *   `POST /api/v1/config/leave-types` : Créer un nouveau type de congé. (Super Admin)
    *   `PUT /api/v1/config/leave-types/{leaveTypeId}` : Modifier un type de congé. (Super Admin)
    *   `DELETE /api/v1/config/leave-types/{leaveTypeId}` : Supprimer un type de congé. (Super Admin)

*   **Jours Fériés:**
    *   `GET /api/v1/config/jours-feries` : Lister les jours fériés pour une année donnée. (Admin)
        *   Query Params: `year`
    *   `POST /api/v1/config/jours-feries` : Ajouter un jour férié. (Super Admin)
        *   Body: `{ date, name, siteId? }` (siteId optionnel si spécifique à un site)
    *   `DELETE /api/v1/config/jours-feries/{holidayId}` : Supprimer un jour férié. (Super Admin)

*   **Périodes Spéciales:**
    *   `GET /api/v1/config/special-periods` : Lister les périodes spéciales (vacances scolaires, etc.). (Admin)
        *   Query Params: `startDate`, `endDate`
    *   `POST /api/v1/config/special-periods` : Définir une période spéciale. (Super Admin)
        *   Body: `{ name, startDate, endDate, description, rulesAdjustment? }`
    *   `PUT /api/v1/config/special-periods/{periodId}` : Modifier une période spéciale. (Super Admin)
    *   `DELETE /api/v1/config/special-periods/{periodId}` : Supprimer une période spéciale. (Super Admin)

*   **Templates de Notification:**
    *   `GET /api/v1/config/notification-templates` : Lister les modèles de notification. (Admin)
    *   `GET /api/v1/config/notification-templates/{templateName}` : Voir un modèle spécifique. (Admin)
    *   `PUT /api/v1/config/notification-templates/{templateName}` : Modifier le contenu d'un modèle. (Super Admin)
        *   Body: `{ subjectTemplate, bodyTemplate, enabledChannels: ['inApp', 'email'] }`

### Notifications (`/api/v1/notifications`)

*   `GET /api/v1/notifications` : Récupérer les notifications de l'utilisateur connecté.
    *   Query Params: `unreadOnly` (boolean), `limit`, `before` (pour pagination)
*   `PUT /api/v1/notifications/{notificationId}/read` : Marquer une notification comme lue.
*   `PUT /api/v1/notifications/read-all` : Marquer toutes les notifications comme lues.
*   `GET /api/v1/notifications/parametres` : Récupérer les préférences de notification de l'utilisateur.
*   `PUT /api/v1/notifications/parametres` : Mettre à jour les préférences de notification (quels types par email, etc.).

### Historique & Audit (`/api/v1/audit`)

*   `GET /api/v1/audit` : Rechercher dans les logs d'audit (Super Admin et Admin).
    *   Query Params: `startDate`, `endDate`, `userId`, `actionType`, `targetEntityType`, `targetEntityId`, `page`, `pageSize`
*   `GET /api/v1/audit/actions/{assignmentId}` : Récupérer l'historique des modifications d'une affectation spécifique.
*   `GET /api/v1/audit/actions/{leaveId}` : Récupérer l'historique des modifications d'une demande de congé.

### Échanges d'Affectations (`/api/v1/exchanges`)

*   `GET /api/v1/exchanges` : Lister ses propres demandes d'échange (envoyées/reçues).
    *   Query Params: `status` (pending, approved, rejected), `direction` (sent, received)
*   `POST /api/v1/exchanges` : Proposer un échange d'affectation.
    *   Body: `{ sourceAssignmentId, targetUserId, message, targetAssignmentId? }` (targetAssignmentId optionnel pour proposer un échange spécifique)
*   `GET /api/v1/exchanges/{exchangeId}` : Voir les détails d'une demande d'échange.
*   `POST /api/v1/exchanges/{exchangeId}/accept` : Accepter une demande d'échange reçue.
*   `POST /api/v1/exchanges/{exchangeId}/reject` : Refuser une demande d'échange reçue.
*   `DELETE /api/v1/exchanges/{exchangeId}` : Annuler une demande d'échange envoyée (si toujours en attente).
*   `POST /api/v1/exchanges/{exchangeId}/admin-approval` : (Admin) Approuver définitivement un échange accepté par les deux parties (si configuration requiert validation admin).

### Requêtes Spécifiques (`/api/v1/specific-requests`)

*   `GET /api/v1/specific-requests` : Lister ses propres requêtes (ou toutes pour admin).
    *   Query Params: `status` (pending, approved, rejected, considered), `startDate`, `endDate`, `userId` (admin)
*   `POST /api/v1/specific-requests` : Soumettre une nouvelle requête.
    *   Body: `{ requestType, targetDate?, targetTimeSlot?, targetRoomId?, targetUserId?, description, priority? }`
*   `GET /api/v1/specific-requests/{requestId}` : Voir les détails d'une requête.
*   `PUT /api/v1/specific-requests/{requestId}` : Modifier sa propre requête (si encore en attente).
*   `DELETE /api/v1/specific-requests/{requestId}` : Annuler sa propre requête.
*   `POST /api/v1/specific-requests/{requestId}/approve` : (Admin) Approuver une requête.
*   `POST /api/v1/specific-requests/{requestId}/reject` : (Admin) Rejeter une requête.
*   `POST /api/v1/specific-requests/{requestId}/consider` : (Admin) Marquer comme "prise en compte" (statut intermédiaire).

### Version du Planning (`/api/v1/planning-versions`)

*   `GET /api/v1/planning-versions` : Lister les versions de planning disponibles.
    *   Query Params: `startDate`, `endDate`, `status` (draft, published, archived)
*   `GET /api/v1/planning-versions/{versionId}` : Obtenir les détails d'une version.
*   `POST /api/v1/planning-versions/{versionId}/publish` : (Admin) Publier une version de planning.
*   `POST /api/v1/planning-versions/{versionId}/archive` : (Admin) Archiver une version publiée.
*   `POST /api/v1/planning-versions/{versionId}/duplicate` : (Admin) Dupliquer une version comme nouveau brouillon.

### Imports / Exports (`/api/v1/io`)

*   **Import Trame Chirurgien:**
    *   `POST /api/v1/io/import/surgeon-schedule` : Importer la trame chirurgien via fichier (CSV/Excel). (Admin)
        *   Request: `multipart/form-data` avec le fichier
        *   Réponse : Résumé de l'import (succès/échecs).
*   **Import Utilisateurs:**
    *   `POST /api/v1/io/import/utilisateurs` : Importer une liste d'utilisateurs (CSV). (Super Admin)
*   **Export Planning:**
    *   `GET /api/v1/io/export/planning` : Exporter le planning (PDF, Excel). (Utilisateur connecté)
        *   Query Params: `startDate`, `endDate`, `format` (`pdf`, `xlsx`), `userId` (Admin), `view` (`global`, `personal`)
*   **Export Compteurs:**
    *   `GET /api/v1/io/export/counters` : Exporter les compteurs d'équité (CSV/Excel). (Admin)
        *   Query Params: `period`, `format`, `role`

---
*(Cette section sera complétée au fur et à mesure du développement)*