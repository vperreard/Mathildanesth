# Fonctionnalités de Communication Interne

## Introduction

Une communication fluide au sein de l'équipe est essentielle pour le bon fonctionnement d'un service. Mathildanesth, en tant qu'outil central de planification, peut également faciliter certains aspects de cette communication, notamment pour les informations contextuelles liées au planning.
La fonctionnalité de "Commentaires Journaliers" est marquée "Indispensable V1" dans `MATHILDA`.

## 1. Commentaires Journaliers Associés au Planning

- **Objectif :** Permettre d'ajouter des informations générales, des rappels ou des notes contextuelles visibles par toute l'équipe consultant le planning d'une journée spécifique.
- **Fonctionnalité Principale (`MATHILDA`) :**
  - Possibilité d'ajouter des commentaires textuels libres associés à une **journée spécifique** du planning.
  - **Qui peut commenter :** Configurable (par défaut dans `MATHILDA` : tous les utilisateurs connectés MAR/IADE/Admin).
  - **Visibilité :** Visible par tous les utilisateurs ayant accès au planning de cette journée.
  - **Historique/Affichage :** Les commentaires précédents pour une même journée restent visibles (ordre chronologique ou autre système de tri/présentation).
- **Exemples d'Usage :**
  - Noter une réunion d'équipe prévue ce jour-là.
  - Signaler un événement spécial (visiteur important, livraison de matériel).
  - Rappeler une procédure particulière à suivre pour la journée.
  - Indiquer une absence courte durée prévue d'un membre du personnel (non bloquante pour une réaffectation mais bonne à savoir).
  - Coordonner des tâches non directement liées aux affectations mais pertinentes pour la journée.
- **Interface :**
  - Une section dédiée sur la vue journalière (ou hebdomadaire avec focus sur un jour) du planning pour afficher et ajouter des commentaires.
  - Éditeur de texte simple pour la saisie.
  - Affichage clair de l'auteur et de l'heure du commentaire.

## 2. Annotations sur Affectations (Plus Granulaire - Évolution Possible)

- **Objectif :** Permettre d'ajouter des notes spécifiques directement sur une affectation particulière.
- **Exemples d'Usage :**
  - "Prévoir passation de consignes spécifique avec X pour cette garde."
  - "Attention : patient Y difficile attendu sur ce créneau de consultation."
- **Interface :**
  - Possibilité d'attacher une note à une affectation (via icône ou clic droit).
  - La note serait visible au survol ou dans les détails de l'affectation.
- _Cette fonctionnalité est une extension possible, la priorité V1 de `MATHILDA` étant sur les commentaires journaliers._

## 3. Annonces Générales (Canal d'Administration)

- **Objectif :** Permettre aux administrateurs de diffuser des messages importants à toute l'équipe ou à des groupes ciblés.
- **Fonctionnalité :**
  - Interface d'administration pour rédiger et publier des annonces.
  - Possibilité de cibler les destinataires (tous, MARs, IADEs, un secteur spécifique).
  - Les annonces pourraient apparaître dans le centre de notifications (`../12_Notifications_Alertes/01_Systeme_Notifications.md`) ou sur un tableau de bord.
- **Exemples d'Usage :**
  - Changement de protocole.
  - Information sur une nouvelle recrue.
  - Rappel de date limite pour soumettre les desiderata.

## Points Clés d'Implémentation

- **Modèle de Données :**
  - Pour les commentaires journaliers : table `DailyComment` avec `date`, `userId` (auteur), `text`, `createdAt`.
  - Pour les annonces : table `Announcement` avec `title`, `content`, `authorId`, `targetAudience`, `publishDate`, `expiryDate`.
- **Intégration avec l'UI du Planning :** Les commentaires journaliers doivent être facilement accessibles depuis les vues de planning.
- **Gestion des Permissions :** Définir clairement qui peut poster, voir, et modérer les commentaires/annonces.
- **Notifications :** Une nouvelle annonce importante ou un commentaire pertinent pourrait déclencher une notification.

## Conclusion

Des outils de communication interne simples et bien intégrés à l'outil de planning peuvent grandement améliorer la coordination et la diffusion d'informations pertinentes au sein de l'équipe. La fonctionnalité de commentaires journaliers est un bon point de départ pour répondre à ce besoin.
