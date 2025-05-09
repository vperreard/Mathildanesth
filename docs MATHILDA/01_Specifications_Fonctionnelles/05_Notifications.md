# 5. Système de Notifications

L'application MATHILDA intégrera un système de notifications pour informer les utilisateurs des événements importants et faciliter la communication.

## 5.1 Types de Notifications

Les notifications suivantes (liste non exhaustive) seront implémentées :

*   **Gestion des Congés :**
    *   Nouvelle demande de congé soumise (pour les administrateurs concernés).
    *   Demande de congé validée (pour le demandeur).
    *   Demande de congé refusée (pour le demandeur, avec motif si fourni).
    *   Rappel de congé à venir (pour le concerné).
*   **Gestion du Planning :**
    *   Nouveau planning publié (pour tous les utilisateurs concernés par le planning).
    *   Modification d'une affectation dans un planning publié (pour l'utilisateur concerné).
    *   Affectation annulée dans un planning publié (pour l'utilisateur concerné).
    *   Alerte de conflit potentiel ou règle non respectée lors de la génération (pour l'administrateur).
*   **Échanges d'Affectations :**
    *   Nouvelle proposition d'échange reçue (pour le destinataire).
    *   Proposition d'échange acceptée (pour l'initiateur et l'admin pour validation).
    *   Proposition d'échange refusée (pour l'initiateur).
    *   Échange validé par l'administrateur (pour les deux utilisateurs concernés).
*   **Gestion des Requêtes Spécifiques :**
    *   Nouvelle requête soumise (pour l'administrateur).
    *   Requête traitée (approuvée/rejetée) (pour le demandeur).
*   **Alertes Système :**
    *   Rappel de saisie des indisponibilités avant génération.
    *   Alerte sur les compteurs d'équité (si un seuil est dépassé).

## 5.2 Canaux de Notification

*   **Dans l'Application (Indispensable) :**
    *   Un centre de notifications accessible depuis l'interface principale (ex: icône cloche).
    *   Affichage d'un badge ou indicateur pour les notifications non lues.
    *   Possibilité de marquer les notifications comme lues ou de les supprimer.
*   **Par Email (Optionnel) :**
    *   Possibilité pour les utilisateurs de configurer (dans leur profil) s'ils souhaitent recevoir certaines notifications par email.
    *   Le contenu de l'email doit être clair et inclure un lien direct vers l'élément concerné dans l'application.

## 5.3 Implémentation Technique

*   La table `notifications` (définie dans le schéma de données) stockera toutes les notifications générées.
*   Un système de tâches en arrière-plan (ou des triggers BDD) pourra être utilisé pour générer les notifications au moment opportun (ex: publication planning, validation congé).
*   L'API fournira des endpoints pour récupérer les notifications de l'utilisateur (lues/non lues) et pour les marquer comme lues. 