# 4. Gestion Fine des Droits et Permissions

Ce document détaille les règles spécifiques de permissions pour les différentes actions dans l'application MATHILDA, en complément des rôles de base (`admin_mar`, `admin_iade`, `mar`, `iade`, `chirurgien`, `secretaire`, `remplacant`, `super_admin`).

## 4.1 Validation des Congés

Les règles de validation des congés dépendent du rôle du demandeur et du valideur :

*   **Congés MAR :** Peuvent uniquement être validés/refusés par un utilisateur ayant le rôle `admin_mar` ou `super_admin`.
*   **Congés IADE :**
    *   Peuvent être validés par un `admin_iade` **UNIQUEMENT SI** la validation n'entraîne pas plus d'un IADE absent simultanément sur la période concernée.
    *   Si la validation entraîne 2 IADE absents ou plus, ou si l'`admin_iade` refuse, la validation doit être escaladée à un `admin_mar` ou `super_admin`.
*   **Congés de "Dernière Minute"** (Demandés moins de X semaines avant, X configurable) : Nécessitent obligatoirement la validation d'un `admin_mar` ou `super_admin`, quel que soit le rôle du demandeur.

## 4.2 Modification du Planning Publié

Une fois qu'une version du planning est marquée comme "publiée" :

*   **Modifications Structurelles** (changement d'affectation, ajout/suppression de poste) : Peuvent uniquement être effectuées par un `admin_mar` ou `super_admin`.
*   **Échanges d'Affectations IADE** :
    *   Un échange d'affectations *au sein de la même semaine* entre deux IADE (sur des postes de même type/durée) peut être validé par un `admin_iade` (ou `admin_mar`, `super_admin`).
    *   L'application doit faciliter la proposition et l'acceptation de ces échanges entre IADE, avec notification à l'administrateur pour validation finale.

## 4.3 Autres Permissions Clés (Exemples)

*   **Génération du Planning :** `admin_mar`, `super_admin`.
*   **Publication du Planning :** `admin_mar`, `super_admin`.
*   **Gestion des Utilisateurs** (Création, modification, désactivation) : `super_admin` (potentiellement `admin_mar` pour certains aspects).
*   **Gestion de la Configuration** (Règles métier, paramètres système) : `super_admin`.
*   **Visualisation des Rapports/Statistiques :** `admin_mar`, `admin_iade`, `super_admin` (potentiellement certains rapports pour `mar`, `iade`).
*   **Gestion des Trâmes Chirurgiens :** `admin_mar`, `secretaire`, `super_admin`.

Ce système sera implémenté via la combinaison des rôles définis dans la table `roles` et potentiellement d'une structure de permissions plus fine dans la colonne `permissions` (JSONB) de cette même table. 