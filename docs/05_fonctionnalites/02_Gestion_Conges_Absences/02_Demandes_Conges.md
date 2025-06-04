# Demandes et Validation des Congés

## 1. Vue d'ensemble

La fonctionnalité de gestion des demandes de congés permet aux utilisateurs de soumettre leurs souhaits d'absence et aux administrateurs/planificateurs de les traiter. Le système vise à simplifier le processus tout en assurant le respect des règles de l'établissement et la continuité du service.

## 2. Soumission d'une Demande de Congé (par l'Utilisateur)

### 2.1. Interface de Demande

- Un formulaire dédié permet à l'utilisateur de saisir sa demande.
- **Champs Requis** :
    - Date de début du congé.
    - Date de fin du congé.
    - Type de congé (ex: Congé Annuel, RTT, Congé sans solde, Formation). La liste des types est configurable par les administrateurs.
- **Champs Optionnels** :
    - Motif/Commentaire (peut être rendu obligatoire pour certains types de congés).
    - Demi-journée de début / Demi-journée de fin (pour les absences d'une demi-journée).

### 2.2. Aide à la Saisie et Informations Contextuelles

- **Validation des Dates** : Le système `useDateValidation` (voir `01_Validation_Dates.md`) est utilisé pour :
    - Empêcher la sélection de dates passées.
    - Gérer les dates de début antérieures aux dates de fin.
    - Potentiellement interdire les weekends/jours fériés pour certains types de congés.
- **Affichage des Congés Existants** : Lors de la sélection des dates, l'utilisateur peut voir :
    - Ses propres congés déjà validés ou en attente sur la période.
    - Le nombre d'autres membres de son équipe/service (`ProfessionalRole` similaire sur le même site/secteur) déjà en congé sur les dates choisies (indicateur de tension).
- **Affichage du Solde de Congés** : L'utilisateur voit son solde disponible pour le type de congé sélectionné (si la gestion des soldes est active, voir `04_Quota_Management_Soldes.md`).

### 2.3. Soumission et Notification

- Une fois la demande soumise, elle passe à un statut "En attente de validation".
- L'utilisateur reçoit une confirmation de sa demande.
- Une notification est automatiquement envoyée au(x) responsable(s) hiérarchique(s) ou au(x) planificateur(s) désigné(s) pour la validation (workflow configurable).

## 3. Validation des Demandes de Congés (par l'Administrateur/Planificateur)

### 3.1. Interface de Validation

- Les administrateurs/planificateurs disposent d'un tableau de bord listant les demandes de congés en attente.
- **Informations Affichées pour chaque demande** :
    - Nom du demandeur.
    - Dates et type de congé.
    - Motif (si fourni).
    - Date de la demande.
    - Indicateur du nombre de personnes du même service/rôle déjà en congé sur la période.
    - Alerte en cas de conflit potentiel avec des règles de quota ou des besoins de service.
- **Filtres et Tris** : Possibilité de filtrer par service, par utilisateur, par date, par statut.

### 3.2. Processus de Décision

- **Validation** : L'administrateur peut valider la demande. Un commentaire peut être ajouté.
- **Refus** : L'administrateur peut refuser la demande. Un motif de refus est généralement requis.
- **Modification (Optionnelle)** : Selon les droits, l'administrateur pourrait proposer une modification des dates, qui retournerait alors à l'utilisateur pour acceptation.

### 3.3. Notification de la Décision

- L'utilisateur demandeur est notifié de la décision (validation ou refus) avec le commentaire/motif éventuel.
- Si la demande est validée, le congé est enregistré dans le système et devient visible sur les plannings.
- L'absence est alors prise en compte par le moteur de planification et pour le calcul des besoins.

## 4. Système d'Acceptation Automatique (Optionnel et Configurable)

Pour alléger la charge des validateurs, un système d'acceptation automatique peut être mis en place sous certaines conditions cumulatives :

- **Délai de prévenance suffisant** : Ex: demande faite plus de X semaines/mois à l'avance.
- **Quota d'absents non dépassé** : Le nombre de personnes du même corps de métier/service déjà en congé sur la période demandée est inférieur à un seuil configurable.
- **Solde de congés suffisant** : L'utilisateur dispose des jours nécessaires pour le type de congé demandé.
- **Type de congé éligible** : Certains types de congés (ex: formation spéciale) peuvent être exclus de l'acceptation automatique.
- **Absence de conflits majeurs** : Pas de conflit avec des périodes de haute activité critiques définies par l'administration.

Si toutes les conditions sont remplies, la demande peut être automatiquement validée. Une notification est envoyée à l'utilisateur et à l'administrateur (pour information). Les administrateurs conservent la possibilité d'annuler un congé auto-approuvé en cas de besoin impérieux (avec justification).

## 5. Annulation d'un Congé

- **Par l'Utilisateur** : Un utilisateur peut demander l'annulation d'un congé validé (avant une certaine date limite). Cette demande d'annulation peut être soumise à validation.
- **Par l'Administrateur** : Un administrateur peut annuler un congé validé (avec justification et notification à l'utilisateur).

## 6. Impact sur le Planning et les Compteurs

- Les congés validés rendent l'utilisateur indisponible pour toute affectation sur la période concernée.
- Les jours de congé sont décomptés des soldes de l'utilisateur (voir `04_Quota_Management_Soldes.md`).
- Les congés sont pris en compte lors de la génération automatique des plannings et pour l'évaluation de l'équité. 