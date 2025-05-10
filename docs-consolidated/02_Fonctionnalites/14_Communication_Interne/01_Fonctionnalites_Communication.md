# Fonctionnalités de Communication Interne

## 1. Introduction

Une communication interne fluide et ciblée est essentielle pour la coordination des équipes, la résolution rapide des problèmes et la diffusion d'informations importantes. Mathildanesth prévoit d'intégrer des outils de communication interne pour compléter les fonctionnalités de planification et de gestion.

La roadmap (`documentation/roadmap-dev-updated.md`) mentionne en Phase 3 (P3) l'"Implémentation de fonctionnalités de **collaboration** : messagerie contextuelle simple, commentaires/annotations sur planning, historique modifications basique". De plus, `docs/technique/NEXT_STEPS.md` évoque un "Système de commentaires et annotations" dans le cadre de l'interface de validation/modification manuelle des plannings (priorité moyenne).

Cette section décrit les fonctionnalités de communication interne envisagées.

## 2. Objectifs

- **Faciliter les Échanges Rapides** : Permettre des discussions courtes et ciblées sans recourir systématiquement à l'e-mail ou au téléphone.
- **Contexte Préservé** : Lier les communications à des éléments spécifiques de l'application (affectations, demandes de congé, jours de planning) pour une meilleure compréhension.
- **Traçabilité des Échanges** : Garder un historique des discussions importantes liées à la planification.
- **Réduction des Malentendus** : Clarifier les informations et les décisions directement dans l'outil de travail.
- **Support à la Collaboration** : Aider à la prise de décision collective et à la coordination des actions.

## 3. Fonctionnalités Envisagées

### 3.1. Commentaires et Annotations sur le Planning

- **Cible** : Affectations spécifiques, jours du planning, demandes de congé, interventions au bloc.
- **Fonctionnement** : Les utilisateurs pourraient ajouter des notes textuelles courtes ou des commentaires sur ces éléments.
  - Exemple : Laisser une note sur une garde : "Prévoir passation d'informations spécifique sur patient X".
  - Commenter une demande de congé pour demander une précision avant validation.
- **Visibilité** : Configurable (visible par tous, par l'équipe concernée, par les managers).
- **Notifications** : Des [Notifications](./../12_Notifications_Alertes/01_Systeme_Notifications.md) pourraient être générées pour les personnes concernées par un nouveau commentaire ou une mention (`@utilisateur`).

### 3.2. Messagerie Contextuelle Simple

- **Cible** : Initier une discussion à partir d'un élément du planning (une garde, une salle, un utilisateur).
- **Fonctionnement** : Un panneau de discussion ou une modale s'ouvrirait, permettant un échange de messages entre les participants concernés par ce contexte.
  - Exemple : Un utilisateur a une question sur une affectation, il peut initier une discussion avec le planificateur directement depuis cette affectation.
- **Participants** : Automatiquement suggérés (personnes sur le même créneau, auteur d'une demande) ou ajoutés manuellement.

### 3.3. Annonces Générales (Moins Contextuel)

- **Cible** : Diffusion d'informations à l'ensemble du service ou à des groupes spécifiques.
- **Fonctionnement** : Un administrateur pourrait publier des annonces visibles sur le tableau de bord ou via le système de notifications.
  - Exemple : "Nouvelle procédure pour la gestion des astreintes à partir du mois prochain."
- Le modèle `Notification` (`prisma/schema.prisma`) a un type `GENERAL_ANNOUNCEMENT` qui pourrait supporter cela.

## 4. Cas d'Usage

- **Clarifications sur le Planning** : "Confirmation : je suis bien en salle 3 demain matin ?"
- **Coordination d'Équipe** : "Qui peut prendre en charge le matériel X pour la salle Y ?"
- **Signalement d'Imprévus Mineurs** : "Léger retard prévu pour ma prise de poste."
- **Demandes d'Informations Rapides** : "Le Dr. Z est-il joignable aujourd'hui ?"
- **Partage de Consignes** : Annotations sur le planning du bloc pour des cas spécifiques.

## 5. Intégration et Interface Utilisateur (Concepts)

- **Indicateurs Visuels** : Une icône sur les éléments du planning pourrait signaler la présence de commentaires/messages non lus.
- **Accès Facile** : Un clic sur l'icône ou l'élément ouvrirait l'interface de lecture/saisie.
- **Panneau de Communication** : Peut-être un panneau latéral ou une section dédiée pour visualiser les discussions en cours ou les annonces.

## 6. Considérations Techniques (Basées sur les Documents Existants)

- **Modèle de Données (à créer)** : Un modèle pour stocker les messages/commentaires (`Message`, `Comment`) serait nécessaire, avec des liens vers les entités concernées (polymorphiques ou spécifiques), l'auteur, et les destinataires/participants.
- **API Backend** : Endpoints pour le CRUD des messages/commentaires et la gestion des notifications associées.
- **WebSockets (Potentiel)** : Pour une expérience de messagerie en temps réel.

## 7. État d'Implémentation

- **Prévu** : Fonctionnalité identifiée dans la roadmap (Phase 3) et les prochaines étapes.
- **Modèle de Données Spécifique** : Non encore visible dans `prisma/schema.prisma` (pour messages/commentaires dédiés).
- **Dépendances** : Système de notifications existant (`Notification` model).

---

L'ajout de fonctionnalités de communication interne, même basiques initialement, enrichira considérablement l'expérience utilisateur de Mathildanesth en centralisant les échanges liés au travail quotidien de planification et d'organisation.
