# Messagerie Contextuelle et Annotations

## 1. Introduction

Pour faciliter la communication et la coordination au sein des équipes, notamment autour de la planification, Mathildanesth vise à intégrer des fonctionnalités de messagerie contextuelle et d'annotations. Celles-ci permettent des échanges ciblés et la traçabilité des discussions relatives à des affectations spécifiques, des jours particuliers ou des événements du planning.

La Phase 3 de la roadmap (`documentation/roadmap-dev-updated.md`) prévoit l'implémentation de fonctionnalités de collaboration, incluant une "messagerie contextuelle simple" et des "commentaires/annotations sur planning".

## 2. Objectifs

- **Communication Ciblée** : Permettre aux utilisateurs de discuter d'éléments spécifiques du planning (une garde, une absence, une intervention au bloc) sans polluer des canaux de communication généraux.
- **Traçabilité** : Conserver un historique des discussions liées à un contexte précis, accessible ultérieurement.
- **Réduction des E-mails/Appels** : Diminuer le besoin de communications externes pour des questions rapides relatives au planning.
- **Collaboration Améliorée** : Faciliter la prise de décision collective et la résolution de problèmes.

## 3. Fonctionnalités Envisagées

### 3.1. Commentaires/Annotations sur les Éléments du Planning

- **Association aux Événements** : Les utilisateurs pourraient ajouter des commentaires ou des annotations directement sur :
  - Une affectation spécifique (ex: une garde, une vacation de bloc).
  - Un congé ou une absence.
  - Une journée entière dans le planning.
  - Une salle d'opération pour un créneau donné.
- **Visibilité** : Les commentaires pourraient être visibles par tous ceux qui ont accès à l'élément concerné, ou ciblés à certains rôles/utilisateurs.
- **Notifications** : Des notifications pourraient être envoyées aux personnes concernées par un nouveau commentaire ou une mention.
- **Contenu des Annotations** : Texte simple, potentiellement avec des mentions d'utilisateurs (`@nomutilisateur`).

### 3.2. Messagerie Contextuelle Simple

Au-delà des simples annotations, une messagerie plus directe pourrait être envisagée :

- **Discussions liées à un Contexte** : Démarrer une discussion à partir d'un élément du planning. La discussion reste attachée à cet élément.
  - Exemple : Un utilisateur a une question sur sa garde du lendemain. Il clique sur sa garde dans le planning et peut initier une discussion avec le planificateur ou les collègues concernés par cette garde.
- **Participants** : Les participants à une discussion contextuelle pourraient être automatiquement suggérés (ex: les personnes affectées au même créneau, le demandeur et le valideur d'un congé) ou ajoutés manuellement.
- **Interface** : Pourrait prendre la forme d'un panneau latéral ou d'une modale s'ouvrant depuis l'élément de planning sélectionné, affichant le fil de la discussion.

## 4. Cas d'Usage

- **Clarification sur une Affectation** : "Suis-je bien prévu en salle 3 demain matin ? Avec quel chirurgien ?"
- **Signalement d'un Imprévu Léger** : "Je risque d'avoir 15 minutes de retard pour ma prise de poste."
- **Coordination pour un Remplacement** : Discussion autour d'une demande de remplacement pour une garde.
- **Questions sur une Demande de Congé** : Échanges entre le demandeur et le manager avant validation.
- **Notes Opérationnelles sur une Journée** : "Attention, maintenance prévue en salle 2 l'après-midi."

## 5. Intégration et Interface Utilisateur

- **Icônes Indicateurs** : Une icône sur les éléments du planning pourrait indiquer la présence de commentaires/discussions non lus.
- **Accès Facile** : Un clic sur l'icône ou l'élément ouvrirait l'interface de consultation/saisie des messages.
- **Centralisation (Optionnel)** : Un centre de notifications ou une section "Mes Discussions" pourrait regrouper les conversations actives ou celles où l'utilisateur est mentionné.

## 6. Considérations Techniques (Conceptuelles)

- **Modèle de Données** : Nécessité de modèles pour stocker les messages/commentaires, leurs liens avec les éléments du planning (affectations, congés, etc.), les utilisateurs impliqués, et les statuts de lecture.
  - Exemple de champs : `id`, `elementId` (polymorphique ou spécifique), `elementType`, `userId`, `parentId` (pour les réponses), `content`, `createdAt`, `readBy` (Json d'IDs utilisateurs).
- **API Backend** : Endpoints pour créer, récupérer, et mettre à jour les messages et notifications.
- **WebSockets (Optionnel)** : Pour une messagerie en temps réel, des WebSockets pourraient être utilisés pour pousser les nouveaux messages aux clients connectés.

## 7. Évolutions Futures

- Support de pièces jointes simples.
- Réactions rapides aux messages (emojis).
- Fonctionnalités de recherche dans les messages.
- Archivage des anciennes discussions.

---

L'intégration de fonctionnalités de messagerie contextuelle et d'annotations, même simples au début, peut grandement améliorer la fluidité de la communication et la collaboration autour de la planification, réduisant les malentendus et accélérant la résolution des problèmes.
