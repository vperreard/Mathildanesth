# Formulaire de Demande de Congé/Absence

Cette interface permet aux utilisateurs (MAR, IADE) de soumettre leurs demandes de congés ou de déclarer des absences.

## 1. Objectif

- Saisir facilement une demande de congé ou une absence.
- Informer l'utilisateur sur le contexte (nombre d'absents déjà prévus).
- Soumettre la demande pour validation (si nécessaire) ou enregistrement.

## 2. Accès

- Via un bouton "Demander un congé" présent sur le Dashboard ou dans un menu dédié.
- Potentiellement accessible en cliquant sur une date future dans la vue Planning.

## 3. Éléments Principaux

Le formulaire (potentiellement dans une modale ou une page dédiée) contiendra :

1.  **Type de Demande :**
    *   Menu déroulant/Boutons radio : "Congé Annuel", "RTT", "Formation", "Maladie", "Absence Autre", etc. (Liste configurable, issue de `Conges.leaveType`).

2.  **Dates :**
    *   Sélecteur de date "Date de début" (`Conges.startDate`).
    *   Sélecteur de date "Date de fin" (`Conges.endDate`).
    *   (Optionnel, si pertinent pour le type) Cases à cocher/Sélecteurs pour "Matin" / "Après-midi" si le congé ne concerne qu'une demi-journée (`Conges.startTime`, `Conges.endTime`).

3.  **Information Contextuelle (Affichage dynamique) :**
    *   Une zone affichant, pour la période sélectionnée :
        *   "Nombre de MAR déjà absents/en congé : X"
        *   "Nombre d'IADE déjà absents/en congé : Y"
    *   *Note : Ces informations sont récupérées via une requête API qui analyse les congés déjà approuvés (`GET /api/v1/leaves?status=approved&startDate=...&endDate=...`).*

4.  **Commentaire :**
    *   Champ de texte multiligne optionnel (`Conges.comment`).

5.  **Boutons d'Action :**
    *   "Soumettre la demande"
    *   "Annuler"

## 4. Interactions Clés

- **Sélection des Dates :** L'utilisateur choisit les dates de début et de fin.
- **Mise à Jour de l'Info Contextuelle :** Dès que les dates sont valides, la zone d'information sur les absents se met à jour.
- **Soumission :**
    - Validation des champs côté client (dates cohérentes, type sélectionné).
    - Envoi de la requête `POST /api/v1/leaves`.
    - Affichage d'un message de confirmation ("Demande soumise avec succès") ou d'erreur.
    - Fermeture de la modale/retour à la page précédente.

## 5. Logique d'Affichage Conditionnelle

- Certains types d'absence (ex: "Maladie") pourraient ne pas nécessiter d'approbation et être directement enregistrés avec le statut "approved".
- L'option demi-journée peut être affichée/masquée selon le type de congé sélectionné.

## 6. Sources de Données (API Endpoints)

- `POST /api/v1/leaves` : Pour soumettre la nouvelle demande.
- `GET /api/v1/leaves?status=approved&startDate=...&endDate=...&fields=utilisateurId` : Pour récupérer les informations nécessaires au calcul du nombre d'absents sur la période.
- `GET /api/v1/users?id=...&fields=roleId` : (Potentiellement côté backend) pour distinguer MAR/IADE dans le compte des absents.

## 7. Maquette Simplifiée (Wireframe - Modale)

```
+------------------------------------------------------+
| Demander un Congé / Déclarer une Absence             |
+------------------------------------------------------+
| Type: [Congé Annuel v]                               |
|                                                      |
| Date début: [ jj/mm/aaaa ]   Date fin: [ jj/mm/aaaa ]|
| [ ] Matin seul   [ ] Après-midi seul                 |
|                                                      |
| -- Informations Période Sélectionnée --             |
|   MAR absents/congés: 2                              |
|   IADE absents/congés: 1                             |
| --------------------------------------               |
|                                                      |
| Commentaire (optionnel):                             |
| +--------------------------------------------------+ |
| |                                                  | |
| |                                                  | |
| +--------------------------------------------------+ |
|                                                      |
+------------------------------------------------------+
|                      [ Annuler ] [ Soumettre Demande ] |
+------------------------------------------------------+
``` 