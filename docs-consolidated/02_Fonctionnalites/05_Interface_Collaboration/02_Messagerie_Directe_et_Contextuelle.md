# Messagerie Directe et Contextuelle

## 1. Vue d'ensemble

Mathildanesth intègre des fonctionnalités de messagerie pour faciliter la communication rapide, ciblée et traçable entre les utilisateurs, directement au sein de l'application. Ces outils visent à réduire la dépendance aux communications externes pour les questions opérationnelles liées à la planification et à l'organisation du service.

Deux modes principaux de messagerie sont envisagés :
1.  **Messagerie Directe** : Pour les conversations privées ou en petits groupes.
2.  **Messagerie Contextuelle et Annotations** : Pour les discussions et commentaires liés à des éléments spécifiques du planning ou de l'application.

La roadmap (`documentation/roadmap-dev-updated.md`, Phase 3) mentionne l'implémentation d'une "messagerie contextuelle simple" et de "commentaires/annotations sur planning".

## 2. Messagerie Directe

Ce mode de messagerie permet des échanges non directement liés à un élément unique du planning, mais plutôt des conversations générales ou privées.

### 2.1. Objectifs
- Communication privée entre utilisateurs.
- Discussions en petits groupes pour des sujets spécifiques.
- Alternative rapide à l'email pour des questions internes à l'utilisation de Mathildanesth.

### 2.2. Fonctionnalités Clés
- **Conversations Individuelles (Messages Directs)**:
    - Initier une conversation privée avec un autre utilisateur Mathildanesth.
    - Recherche d'utilisateurs par nom.
- **Discussions de Groupe (Optionnel, plus avancé)**:
    - Création de groupes de discussion thématiques (ex: "Planificateurs", "Référents Congés").
    - Gestion simple des membres.
- **Interface Utilisateur**:
    - Un panneau ou une section dédiée "Messagerie" dans l'application.
    - Liste des conversations récentes.
    - Interface de chat classique pour l'affichage des messages.

## 3. Messagerie Contextuelle et Annotations

Ce mode est conçu pour ancrer les discussions à des éléments spécifiques de l'application, fournissant un contexte immédiat.

### 3.1. Objectifs
- **Communication Ciblée** : Discuter d'éléments précis (affectation, congé, journée de planning, salle de bloc) sans polluer d'autres canaux.
- **Traçabilité des Décisions** : Conserver un historique des échanges relatifs à un contexte particulier.
- **Collaboration Améliorée** : Faciliter la résolution de problèmes et la prise de décision collective autour d'un point précis.

### 3.2. Fonctionnalités Clés
- **Commentaires/Annotations sur les Éléments du Planning**:
    - Associer des commentaires directement à une affectation, un congé, une absence, une journée de planning, une salle pour un créneau.
    - Visibilité configurable (public, rôles spécifiques, participants à l'élément).
    - Contenu : Texte simple, mentions d'utilisateurs (`@nomutilisateur`).
- **Discussions liées à un Contexte Spécifique**:
    - Démarrer une discussion depuis un élément du planning, la discussion restant attachée à cet élément.
    - Participants suggérés (personnes affectées, demandeur/valideur) ou ajoutés manuellement.
- **Interface Utilisateur**:
    - Icônes sur les éléments du planning indiquant des commentaires/discussions.
    - Panneau latéral ou modale s'ouvrant depuis l'élément pour afficher/participer à la discussion.

### 3.3. Cas d'Usage Typiques
- Clarification sur une affectation: "Suis-je bien prévu en salle 3 ?"
- Signalement d'imprévu: "Je serai en retard de 15 min."
- Coordination pour un remplacement.
- Questions sur une demande de congé.
- Notes opérationnelles: "Maintenance en salle 2 cet après-midi."

## 4. Fonctionnalités Communes et Considérations Générales

### 4.1. Fonctionnalités Standard
- **Envoi de messages texte**.
- **Notifications** : Intégration avec le centre de notifications de Mathildanesth pour les nouveaux messages/commentaires/mentions.
- **Indicateurs de statut** (optionnel) : "Lu par", "En train d'écrire".
- **Recherche de messages** : Dans ses propres conversations ou les annotations accessibles.
- **Pièces jointes simples** (optionnel et à évaluer) : Pour des fichiers légers. Le partage de documents plus formels est traité dans `03_Partage_Documents_Liens.md`.

### 4.2. Interface Utilisateur Générale
- **Notifications visuelles** (pastilles) sur l'icône de messagerie/notifications.
- **Centralisation (Optionnel)** : Un centre "Mes Discussions/Mentions" pourrait regrouper toutes les interactions pertinentes pour l'utilisateur.

### 4.3. Intégration Rôles et Permissions
- Définir qui peut initier des conversations avec qui, ou qui peut voir/participer à certaines discussions contextuelles.

### 4.4. Points d'Attention
- **Définir l'usage attendu** par rapport aux emails ou autres canaux officiels.
- **Gestion des archives et de la suppression** : Politiques de conservation.
- **Sécurité et confidentialité** des échanges.
- **Volume de notifications** : Permettre des préférences pour éviter la surcharge.

### 4.5. Considérations Techniques (Conceptuelles)
- **Modèle de Données** : Nécessité de modèles pour stocker messages, commentaires, liens contextuels (polymorphiques ou spécifiques), participants, statuts de lecture.
    - Champs typiques : `id`, `contextElementId`, `contextElementType`, `userId`, `parentId`, `content`, `createdAt`, `readBy`.
- **API Backend** : Endpoints pour CRUD des messages/annotations et gestion des notifications.
- **WebSockets (Optionnel)** : Pour des mises à jour en temps réel.

## 5. Évolutions Futures

- Support de réactions rapides (emojis).
- Fonctionnalités de recherche avancées.
- Archivage des discussions.

En combinant messagerie directe et contextuelle, Mathildanesth peut significativement améliorer la communication et la collaboration quotidiennes autour de la planification. 