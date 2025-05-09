# Interface de Gestion des Utilisateurs (Admin)

Cette interface permet aux administrateurs (Super Admin principalement, potentiellement Admin MAR/IADE pour certaines actions) de gérer les comptes utilisateurs.

## 1. Objectif

- Créer, visualiser, modifier et désactiver/supprimer des comptes utilisateurs.
- Assigner et modifier les rôles (professionnels et administratifs).
- Configurer les spécificités de chaque utilisateur (temps partiel, alias, jours travaillés pour MARs).

## 2. Accès

- Via une section dédiée dans le menu d'administration ("Gestion Utilisateurs" ou similaire).

## 3. Éléments Principaux

1.  **Barre d'Actions/Filtres (Haut) :**
    *   Bouton "Ajouter un utilisateur".
    *   Champ de recherche (par nom, prénom, email, username).
    *   Filtre par rôle (Tous, MAR, IADE, Admin MAR, etc.).
    *   Filtre par statut (Actif / Inactif).

2.  **Liste des Utilisateurs :**
    *   Tableau affichant les utilisateurs correspondant aux filtres.
    *   **Colonnes Clés :**
        *   Nom Prénom
        *   Username
        *   Email
        *   Rôle Principal (`Roles.name`)
        *   Temps Travail (`Users.workingTime` en %)
        *   Statut (Actif/Inactif)
        *   Actions (Modifier, Désactiver/Activer, Supprimer)

3.  **Formulaire d'Ajout/Modification (Modale ou Page dédiée) :**
    *   **Informations de Base :**
        *   Prénom (`Users.firstName`) - NN
        *   Nom (`Users.lastName`) - NN
        *   Email (`Users.email`) - UQ, NN
        *   Username (`Users.username`) - UQ, NN (suggestion auto: 1ere lettre prénom + nom)
        *   Mot de passe (champ pour création, option "Réinitialiser le mot de passe" pour modification) - NN
        *   Numéro de téléphone (`Users.phoneNumber`)
    *   **Rôle et Statut :**
        *   Menu déroulant "Rôle Principal" (liste issue de `Roles`) - NN
        *   Case à cocher "Est Administrateur MAR" (si applicable)
        *   Case à cocher "Est Administrateur IADE" (si applicable)
        *   Bouton radio/Case à cocher "Statut" (Actif/Inactif) - NN
    *   **Paramètres Spécifiques :**
        *   Champ numérique "Temps de Travail (%)" (ex: 80, 100) - NN
        *   (Si rôle Chirurgien) Champ texte "Alias Google Sheets" (`Users.googleSheetsAlias`)
        *   **(Si rôle MAR) Section "Jours/Schéma de Travail" :**
            *   *Note : La gestion fine (semaines paires/impaires, mois sur deux) est complexe. Pour une V1, on pourrait avoir un champ texte libre "Description Schéma" ou des options simplifiées.* 
            *   Option 1 : Champ Texte Libre "Description du schéma de travail" (ex: "Lundi, Mardi sem. paires ; Lu, Ma, Me sem. impaires").
            *   Option 2 (Plus structuré, plus complexe) : Cases à cocher pour jours fixes (L/M/M/J/V), + options "Semaines Paires/Impairés/Toutes", + potentiellement un sélecteur "Mois 1 / Mois 2". **-> À affiner lors du développement.**
    *   **(Si rôle IADE) Rappel des Heures Hebdo :** Affichage informatif basé sur le % temps travail (ex: "~35h/semaine").
    *   **Compétences :**
        *   Liste des compétences (`Competences`) avec possibilité d'associer/dissocier.
        *   Pour chaque compétence associée : niveau (`UserSkills.level`), préférence (`UserSkills.preference`).
    *   **(Si rôle Chirurgien) Spécialités :**
        *   Liste des spécialités (`Specialites`) avec possibilité d'associer/dissocier.

4.  **Gestion des Chirurgiens (Point à Clarifier) :**
    *   Si la liste des chirurgiens (pour la trame) doit être gérée indépendamment des utilisateurs système :
        *   Il faudrait une interface distincte "Gestion des Chirurgiens" (hors gestion utilisateurs).
        *   Cette interface permettrait de lister/ajouter/modifier les chirurgiens référencés dans la trame, avec leur nom complet et l'éventuel `googleSheetsAlias`.
        *   Le lien se ferait via le `googleSheetsAlias` si un chirurgien a *aussi* un compte utilisateur.
    *   *Alternative (plus simple V1) :* On considère que seuls les chirurgiens ayant un compte utilisateur (`Users` avec rôle chirurgien) peuvent être référencés nommément dans la trame via leur `userId`. Les autres sont juste des noms dans la trame importée.

## 4. Interactions Clés

- **Ajouter Utilisateur :** Clic sur "Ajouter", remplissage du formulaire, validation.
- **Modifier Utilisateur :** Clic sur "Modifier", modification dans le formulaire, validation.
- **Rechercher/Filtrer :** La liste se met à jour.
- **Désactiver/Activer :** Clic sur le bouton, confirmation, mise à jour du statut (`Users.isActive`). Un utilisateur désactivé ne peut plus se connecter mais ses données historiques sont conservées.
- **Supprimer :** Clic sur "Supprimer", **confirmation forte** (car supprime définitivement l'utilisateur et potentiellement ses données liées - attention aux contraintes FK !). Préférer la désactivation.
- **Réinitialiser Mot de Passe :** Génère un nouveau mot de passe temporaire ou envoie un lien de réinitialisation.

## 5. Sources de Données (API Endpoints)

- `GET /api/v1/users?search=...&roleId=...&isActive=...` : Pour lister et filtrer les utilisateurs.
- `POST /api/v1/users` : Pour créer un nouvel utilisateur.
- `GET /api/v1/users/:id` : Pour récupérer les détails d'un utilisateur pour modification.
- `PUT /api/v1/users/:id` : Pour mettre à jour un utilisateur.
- `PATCH /api/v1/users/:id` : Pour des mises à jour partielles (ex: changement de statut).
- `DELETE /api/v1/users/:id` : Pour supprimer un utilisateur (à utiliser avec précaution).
- `POST /api/v1/users/:id/reset-password` : Pour réinitialiser le mot de passe.
- `GET /api/v1/roles` : Pour peupler le menu déroulant des rôles.
- `GET /api/v1/skills` : Pour lister les compétences disponibles.
- `GET /api/v1/specialties` : Pour lister les spécialités disponibles.
- API pour gérer les `user_skills` et `user_specialties` (probablement via les endpoints `PUT /api/v1/users/:id`).

## 6. Maquette Simplifiée (Wireframe - Page Admin)

```
+--------------------------------------------------------------------------------------------------+
| Gestion des Utilisateurs                                                                         |
+--------------------------------------------------------------------------------------------------+
| [Ajouter Utilisateur] | Chercher: [_______] Filtres: Rôle [Tous v] Statut [Actif v]              |
+--------------------------------------------------------------------------------------------------+
| Nom Prénom     | Username   | Email                 | Rôle       | Tps Trav. | Statut | Actions  |
+----------------|------------|-----------------------|------------|-----------|--------|----------|
| Dupont, Jean   | jdupont    | j.dupont@hopital.fr   | MAR        | 100%      | Actif  | [M][D][S]|
| Martin, Sophie | smartin    | s.martin@hopital.fr   | IADE       | 80%       | Actif  | [M][D][S]|
| Durand, Pierre | pdurand    | p.durand@hopital.fr   | Chirurgien | 100%      | Inactif| [M][A][S]|
| ...            | ...        | ...                   | ...        | ...       | ...    | ...      |
+--------------------------------------------------------------------------------------------------+
(M = Modifier, D = Désactiver, A = Activer, S = Supprimer)

Wireframe - Formulaire Ajout/Modif (extrait):
+---------------------------------------------+
| Ajouter/Modifier Utilisateur                |
+---------------------------------------------+
| Prénom: [_______] Nom: [_______]            |
| Email: [__________] Username: [_______]     |
| Mot de passe: [********]                    |
| Rôle: [MAR v] [ ] Admin MAR [ ] Admin IADE  |
| Statut: (x) Actif ( ) Inactif               |
| Temps Travail (%): [100]                    |
| (MAR) Schéma Travail: [___________________] |
| (Chir) Alias Sheets: [___________________]  |
| Compétences: [Pédiatrie(Expert,Pref) +] ... |
| ...                                         |
+---------------------------------------------+
|           [ Annuler ] [ Enregistrer ]       |
+---------------------------------------------+
``` 