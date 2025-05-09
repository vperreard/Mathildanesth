# Interface de Validation des Congés (Admin)

Cette interface est destinée aux administrateurs (Admin MAR, Admin IADE, Super Admin) pour gérer les demandes de congés en attente.

## 1. Objectif

- Visualiser rapidement les demandes de congé en attente.
- Accéder aux informations contextuelles nécessaires à la décision (nombre d'absents, détails demande).
- Approuver ou rejeter facilement les demandes.
- Assurer la traçabilité des décisions.

## 2. Accès

- Via une section dédiée dans le menu d'administration ("Validation Congés" ou similaire).
- Potentiellement via un lien depuis les notifications (page d'accueil / header).

## 3. Notifications et Rappels

- **Notification Page d'Accueil :** Un badge ou un encart sur le dashboard administrateur indiquant "X demandes de congé en attente".
- **Rappel dans le Header :**
    - Si des demandes sont en attente, une icône discrète apparaît dans le header.
    - Au survol/clic, un petit pop-up affiche les 1 ou 2 demandes les plus anciennes en attente.
    - Chaque ligne du pop-up montre : Nom utilisateur, Dates congé, Type.
    - Boutons "Voir détails" (renvoie vers la page de validation complète) et potentiellement "Approuver" / "Rejeter" rapides (avec confirmation).
    - Limité à 2 demandes max pour ne pas surcharger.

## 4. Éléments Principaux (Page de Validation Dédiée)

1.  **Filtres/Tri :**
    *   Filtre par statut (par défaut : "En attente", mais aussi "Approuvées", "Rejetées").
    *   Filtre par rôle (MAR / IADE).
    *   Filtre par période (date de début du congé).
    *   Tri par date de demande (plus ancienne/récente), date de début de congé.

2.  **Liste des Demandes :**
    *   Tableau affichant les demandes de congé correspondant aux filtres.
    *   **Colonnes Clés :**
        *   Demandeur (Nom Prénom)
        *   Rôle (MAR/IADE)
        *   Type de Congé
        *   Date de Début
        *   Date de Fin
        *   Durée (calculée)
        *   Date de la Demande
        *   Statut (En attente, Approuvée, Rejetée)
        *   **Nb Absents MAR (sur période)** : Nombre de MAR déjà en congé/absents approuvés sur les dates de la demande.
        *   **Nb Absents IADE (sur période)** : Nombre d'IADE déjà en congé/absents approuvés sur les dates de la demande.
        *   Actions

3.  **Zone de Détail (Optionnelle) :**
    *   En cliquant sur une ligne, un panneau latéral ou une section sous la ligne peut afficher plus de détails :
        *   Commentaire du demandeur.
        *   Historique (si déjà rejetée puis resoumise).
        *   Commentaire de l'approbateur (si déjà traitée).

4.  **Actions par Ligne :**
    *   Bouton "Approuver"
    *   Bouton "Rejeter"

## 5. Interactions Clés

- **Filtrer/Trier :** La liste se met à jour dynamiquement.
- **Visualiser le Contexte :** Les colonnes "Nb Absents MAR/IADE" permettent une décision rapide.
- **Approuver :**
    - Clic sur "Approuver".
    - Envoi de la requête `POST /api/v1/leaves/:id/approve`.
    - Mise à jour du statut dans la liste, notification à l'utilisateur.
- **Rejeter :**
    - Clic sur "Rejeter".
    - Une petite modale s'ouvre demandant un commentaire (optionnel mais recommandé) (`Conges.approverComment`).
    - Envoi de la requête `POST /api/v1/leaves/:id/reject` avec le commentaire.
    - Mise à jour du statut dans la liste, notification à l'utilisateur.

## 6. Sources de Données (API Endpoints)

- `GET /api/v1/leaves?status=pending&role=...&startDate=...&sortBy=...` : Pour récupérer les demandes en attente et les autres statuts selon les filtres.
- `GET /api/v1/leaves?status=approved&startDate=...&endDate=...&fields=utilisateurId` : Utilisé (potentiellement par le backend lors de la récupération des demandes) pour calculer le nombre d'absents sur la période de chaque demande en attente.
- `GET /api/v1/users?id=...&fields=roleId` : (Potentiellement côté backend) pour distinguer MAR/IADE dans le compte des absents.
- `POST /api/v1/leaves/:id/approve` : Pour approuver une demande.
- `POST /api/v1/leaves/:id/reject` : Pour rejeter une demande (avec commentaire).

## 7. Maquette Simplifiée (Wireframe - Page Admin)

```
+----------------------------------------------------------------------------------------------------------------------+
| Validation des Demandes de Congés                                                                                    |
+----------------------------------------------------------------------------------------------------------------------+
| Filtres: Statut [En attente v] Rôle [Tous v] Période [Ce mois v] | Trier par: [Date Demande (Asc) v]                 |
+----------------------------------------------------------------------------------------------------------------------+
| Demandeur      | Rôle | Type Congé   | Début      | Fin        | Durée | Demandé le | Statut     | MAR Abs | IADE Abs | Actions         |
+----------------|------|--------------|------------|------------|-------|------------|------------|---------|----------|-----------------|
| Dupont, Jean   | MAR  | Annuel       | 15/06/2023 | 22/06/2023 | 6 j   | 20/05/2023 | En attente |    1    |    0     | [Appr.] [Rej.]  |
| Martin, Sophie | IADE | RTT          | 19/06/2023 | 19/06/2023 | 1 j   | 22/05/2023 | En attente |    2    |    1     | [Appr.] [Rej.]  |
| ...            | ...  | ...          | ...        | ...        | ...   | ...        | ...        |   ...   |   ...    | ...             |
+----------------------------------------------------------------------------------------------------------------------+

Pop-up Header (Exemple):
+---------------------------------------+
| Demandes en attente :                 |
| ------------------------------------- |
| Dupont J. | 15/06 - 22/06 | Annuel  |
| Martin S. | 19/06         | RTT     |
|          [Voir tout] [Options Rapides?] |
+---------------------------------------+
``` 