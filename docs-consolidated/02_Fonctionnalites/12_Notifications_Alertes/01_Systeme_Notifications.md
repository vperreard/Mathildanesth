# Système de Notifications et d'Alertes

## 1. Introduction

Un système de notifications et d'alertes efficace est crucial pour maintenir les utilisateurs informés des événements importants, des changements de statut, des actions requises et des problèmes potentiels au sein de Mathildanesth. Il vise à améliorer la communication, la réactivité et l'engagement des utilisateurs.

Le projet `MATHILDA` identifiait un "Système de notification" comme une fonctionnalité indispensable V1. Le modèle `Notification` dans `prisma/schema.prisma` de `mathildanesth` fournit la structure de base pour cette fonctionnalité.

## 2. Objectifs du Système de Notifications

- **Information en Temps Opportun** : Informer les utilisateurs des événements pertinents les concernant sans délai excessif.
- **Réduction de la Charge Cognitive** : Éviter que les utilisateurs aient à chercher activement les mises à jour ; les informations importantes leur parviennent.
- **Appel à l'Action** : Signaler aux utilisateurs lorsqu'une action de leur part est nécessaire (ex: valider une demande).
- **Amélioration de la Collaboration** : Faciliter la communication autour des processus clés (congés, échanges, planification).
- **Traçabilité** : Conserver un historique des notifications envoyées.

## 3. Modèle de Données : `Notification`

Le modèle `Notification` (`prisma/schema.prisma`) est au cœur du système :

- `id` (Int) : Identifiant unique.
- `userId` (Int) : Destinataire de la notification (relation `user`).
- `type` (String) : Catégorie de la notification. Exemples :
  - `NEW_LEAVE_REQUEST` : Nouvelle demande de congé soumise (pour le manager).
  - `LEAVE_STATUS_CHANGED` : Statut d'une demande de congé modifié (pour le demandeur).
  - `SWAP_REQUEST_RECEIVED` : Nouvelle demande d'échange reçue.
  - `SWAP_REQUEST_UPDATED` : Statut d'une demande d'échange modifié.
  - `ASSIGNMENT_UPDATED` : Une affectation de l'utilisateur a été modifiée.
  - `PLANNING_PUBLISHED` : Un nouveau planning a été publié.
  - `RULE_CONFLICT_PENDING` : Un conflit de règle nécessite attention (pour le planificateur).
  - `USER_MENTION` : L'utilisateur a été mentionné dans un commentaire.
  - `GENERAL_ANNOUNCEMENT` : Annonce générale.
- `title` (String) : Titre court de la notification.
- `message` (String) : Contenu détaillé de la notification.
- `read` (Boolean) : Indique si l'utilisateur a lu la notification (nom du champ dans Prisma: `read`).
- `createdBy` (Int) : ID de l'utilisateur (ou système) ayant initié l'événement (relation `creator`).
- `createdAt`, `updatedAt`.

Un champ `link` (pour une redirection directe vers l'élément concerné) n'est pas explicitement présent dans le modèle Prisma actuel. Ce lien pourrait être :
- Inclus dans le corps du `message`.
- Reconstruit dynamiquement côté client en se basant sur le `type` de la notification et d'éventuels identifiants passés dans le `message` ou un champ `metadata` (Json) qui pourrait être ajouté au modèle `Notification` si nécessaire.

## 4. Événements Déclenchant des Notifications (Exemples)

### 4.1. Gestion des Congés et Absences

- Nouvelle demande de congé soumise (au manager).
- Demande de congé validée/refusée (au demandeur).
- Rappel de demande de congé en attente (au manager).

### 4.2. Échanges d'Affectations

- Nouvelle demande d'échange reçue (au destinataire de la demande).
- Demande d'échange acceptée/refusée par le pair (à l'initiateur).
- Demande d'échange nécessitant validation admin (à l'admin).
- Demande d'échange finalisée (aux deux utilisateurs et à l'admin).

### 4.3. Planification et Affectations

- Publication d'un nouveau planning (aux utilisateurs concernés par le planning).
- Modification significative d'une affectation personnelle (à l'utilisateur concerné).
- Alerte de conflit de règle majeur non résolu (au planificateur).
- Rappel d'affectation importante (ex: garde à venir).

### 4.4. Requêtes Personnelles

- Nouvelle requête soumise (au planificateur).
- Statut d'une requête mis à jour (à l'utilisateur).

### 4.5. Communication et Collaboration (si implémenté)

- Mention dans un commentaire ou une discussion ([`../05_Interface_Collaboration/01_Messagerie_Contextuelle.md`](../../05_Interface_Collaboration/01_Messagerie_Contextuelle.md)).

### 4.6. Administration et Système

- Annonces générales de l'administrateur.
- Alertes système (rares, ex: maintenance à venir).

## 5. Canaux de Notification

- **Notifications In-App** :
  - Un centre de notifications dans l'interface utilisateur (ex: icône cloche avec un compteur de non-lues).
  - Liste des notifications récentes, avec possibilité de les marquer comme lues.
  - Redirection vers l'élément concerné via le `link`.
- **Notifications par E-mail (Optionnel/Configurable)** :
  - Pour les notifications importantes ou urgentes, ou pour les utilisateurs moins fréquemment connectés.
  - L'utilisateur pourrait configurer ses préférences de notification par e-mail.
- **Notifications Push Mobiles (Perspective)** :
  - Si une application mobile PWA ou native est développée.

## 6. Interface Utilisateur

- **Centre de Notifications** : Un endroit centralisé pour voir toutes les notifications.
  - Possibilité de filtrer (toutes, non lues).
  - Marquer comme lue/non lue, supprimer (archiver).
- **Indicateurs Visuels Discrets** : Badges sur les icônes ou les éléments du menu pour signaler de nouvelles notifications.
- **Préférences de Notification** : Page de profil où l'utilisateur peut (idéalement) configurer quels types de notifications il souhaite recevoir et par quels canaux.

## 7. Gestion et Administration

- **Modèles de Notifications** : Pour standardiser le contenu des messages pour chaque `type` de notification.
- **Journalisation** : Historique des notifications envoyées (pour audit ou débogage).
- **Configuration des Déclencheurs** : Permettre aux administrateurs de gérer quels événements déclenchent des notifications et à qui elles sont envoyées (dans une certaine mesure).

## 8. Points Clés d'Implémentation

- **Service de Notification Centralisé** : Un service backend (`NotificationService.ts`) responsable de la création, du stockage, et de l'envoi potentiel des notifications.
- **Fiabilité** : S'assurer que les notifications sont générées et livrées de manière fiable.
- **Pertinence et Volume** : Éviter de surcharger les utilisateurs avec trop de notifications non essentielles. Offrir des options de personnalisation est clé.
- **Sécurité** : S'assurer que les notifications ne divulguent pas d'informations sensibles à des utilisateurs non autorisés (le `userId` du modèle `Notification` garantit que la notification est pour un destinataire spécifique).

---

Un système de notifications bien pensé est un facilitateur clé pour l'adoption et l'utilisation efficace de Mathildanesth, en rendant l'application plus dynamique et communicative.
