# Interface Mon Profil / Mes Compteurs

Cette section permet à l'utilisateur connecté de consulter et potentiellement modifier ses propres informations, ainsi que de suivre ses compteurs.

## 1. Objectif

- Visualiser les informations personnelles et professionnelles.
- Modifier certaines informations (mot de passe, préférences).
- Suivre les compteurs clés (heures, gardes, consultations, pénibilité).

## 2. Accès

- Via un lien/menu "Mon Profil" ou en cliquant sur son nom/avatar dans le header.

## 3. Éléments Principaux

La page pourrait être organisée en onglets ou sections :

1.  **Onglet/Section "Informations Personnelles" :**
    *   Affichage (non modifiable ici) : Prénom, Nom, Username, Email, Rôle principal.
    *   Champ "Numéro de téléphone" (`Users.phoneNumber`) - Modifiable.
    *   Bouton "Changer mon mot de passe" (ouvre une modale dédiée).

2.  **Onglet/Section "Préférences" :**
    *   Préférences de notification (ex: recevoir emails pour...). - *Fonctionnalité future*
    *   Préférences d'affichage (Thème clair/sombre, vue planning par défaut). - *Fonctionnalité future*
    *   (MAR/IADE) Gestion des compétences/préférences (`UserSkills`) : Visualiser les compétences associées, peut-être modifier le niveau/préférence si autorisé.
    *   (MAR/IADE) Soumettre/Voir ses requêtes spécifiques (`Specific_Requests`).

3.  **Onglet/Section "Mes Compteurs" :**
    *   **Compteur Horaire (MARs) :**
        *   Affichage du solde actuel (calculé sur la période définie dans la config).
        *   Visualisation simple (graphique ?) de l'évolution sur les derniers mois.
        *   Objectif théorique pour la période en cours.
    *   **Compteur Gardes (MARs) :**
        *   Nombre de gardes effectuées (semaine / weekend / férié) sur la période.
        *   Objectif/Moyenne équipe (si pertinent).
    *   **Compteur Consultations (MARs) :**
        *   Nombre de consultations effectuées sur la période.
        *   Objectif/Moyenne équipe.
    *   **Compteur Fermetures (IADEs) :**
        *   Nombre de fermetures effectuées (total / vendredi) sur la période.
        *   Objectif/Moyenne équipe (prorata temps travail).
    *   **Compteur Pénibilité (MARs) :**
        *   Score de pénibilité actuel (calculé sur les 7 derniers jours, configurable).
        *   Visualisation simple de l'évolution récente.
    *   **(Optionnel) Déclaration d'Heures (MARs) :**
        *   Si la fonctionnalité est activée, bouton "Déclarer mes heures" ouvrant un formulaire simple.
        *   Liste des déclarations récentes avec leur statut (En attente, Validée, Rejetée).

## 4. Interactions Clés

- **Modifier Téléphone :** Saisie dans le champ, bouton "Enregistrer".
- **Changer Mot de Passe :** Clic sur bouton, modale avec champs "Ancien MDP", "Nouveau MDP", "Confirmer Nouveau MDP", validation.
- **Gérer Compétences/Requêtes :** Interactions spécifiques à ces sections.
- **Visualiser Compteurs :** Sélection de la période d'affichage si plusieurs options.
- **Déclarer Heures :** Clic bouton, remplissage formulaire (date, heures, type, commentaire), soumission.

## 5. Sources de Données (API Endpoints)

- `GET /api/v1/users/me` : Pour récupérer toutes les informations de l'utilisateur connecté.
- `PUT /api/v1/users/me` ou `PATCH /api/v1/users/me` : Pour mettre à jour les informations modifiables (téléphone).
- `POST /api/v1/auth/change-password` : Pour changer le mot de passe.
- `GET /api/v1/users/me/skills`, `PUT /api/v1/users/me/skills` : Pour gérer les compétences.
- `GET /api/v1/requests?utilisateurId=me` : Pour lister ses requêtes spécifiques.
- `GET /api/v1/counters/user/me?period=...&type=...` : Pour récupérer les valeurs des différents compteurs.
- `POST /api/v1/counters/hours-declaration` : Pour soumettre une déclaration d'heures.
- `GET /api/v1/counters/hours-declaration?utilisateurId=me` : Pour lister ses déclarations.

## 6. Maquette Simplifiée (Wireframe - Page Profil)

```
+------------------------------------------------------+
| Mon Profil & Compteurs                               |
+------------------------------------------------------+
| [ Infos Perso. | Préférences | Mes Compteurs ]       |
+------------------------------------------------------+
|                                                      |
| == Onglet Informations Personnelles ==               |
|   Nom: Dupont, Jean                                  |
|   Username: jdupont                                  |
|   Email: j.dupont@hopital.fr                         |
|   Rôle: MAR                                          |
|   Téléphone: [ 0612345678 ] [Enregistrer]           |
|   [ Changer mon mot de passe ]                       |
|                                                      |
| == Onglet Mes Compteurs (Exemple MAR) ==             |
|   --- Compteur Horaire ---                           |
|     Période: Mai 2023                                |
|     Solde: + 8.5 h (Cible: 150 h)                    |
|     [Voir Historique]                                |
|   --- Compteur Gardes ---                            |
|     Semaine: 2 | WE: 1 | Férié: 0                    |
|   --- Compteur Consultations ---                     |
|     Ce mois: 4                                       |
|   --- Pénibilité (7j glissants) ---                  |
|     Score: 12.5 pts                                  |
|   [ Déclarer mes heures ]                            |
|   --- Déclarations Récentes ---                      |
|     15/05 | 4h Suppl. | Validée                      |
|     ...                                              |
|                                                      |
+------------------------------------------------------+ 