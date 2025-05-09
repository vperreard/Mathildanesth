# Diagramme Relationnel des Entités (Conceptuel)

Ce document décrit les entités principales du système MATHILDA et les relations qui existent entre elles. Il sert de base conceptuelle avant le détail des attributs de chaque table.

## Légende des Relations

*   **1-1 (Un-à-un)** : Chaque instance d\'une entité est liée à une seule instance d\'une autre entité, et vice-versa.
*   **1-N (Un-à-plusieurs)** : Une instance d\'une entité peut être liée à plusieurs instances d\'une autre entité, mais une instance de la seconde entité n\'est liée qu\'à une seule instance de la première.
*   **N-N (Plusieurs-à-plusieurs)** : Plusieurs instances d\'une entité peuvent être liées à plusieurs instances d\'une autre entité. Ces relations sont souvent implémentées via une table de jonction.

## Entités Principales et Leurs Relations

Nous pouvons regrouper les entités par domaines fonctionnels :

### 1. Gestion des Accès et Utilisateurs

*   **Entités :** `Utilisateur`, `Rôle`, `Permission`, `CorpsMetier`, `Competence`, `SpecialiteChir`

*   **Relations Clés :**
    *   `Utilisateur` (N) --- (1) `Rôle` : Un utilisateur possède un rôle principal. Un rôle peut être assigné à plusieurs utilisateurs.
    *   `Rôle` (N) --- (N) `Permission` (via `RolePermission`) : Un rôle peut avoir plusieurs permissions, et une permission peut appartenir à plusieurs rôles.
    *   `Utilisateur` (N) --- (1) `CorpsMetier` : Un utilisateur appartient à un corps de métier. Un corps de métier regroupe plusieurs utilisateurs.
    *   `Utilisateur` (N) --- (N) `Competence` (via `UtilisateurCompetence`) : Un utilisateur (ex: IADE) peut posséder plusieurs compétences. Une compétence peut être possédée par plusieurs utilisateurs.
    *   `Utilisateur` (N) --- (1) `SpecialiteChir` (pour la spécialité principale, optionnelle) : Un utilisateur (ex: Chirurgien) peut avoir une spécialité chirurgicale principale.
    *   `Utilisateur` (N) --- (N) `SpecialiteChir` (via `UtilisateurSpecialite`) : Un utilisateur peut être associé à plusieurs spécialités chirurgicales.

### 2. Structure Organisationnelle

*   **Entités :** `Site`, `Secteur`, `Salle`

*   **Relations Clés :**
    *   `Site` (1) --- (N) `Secteur` : Un site (hôpital, clinique) est composé de plusieurs secteurs d\'activité.
    *   `Secteur` (1) --- (N) `Salle` : Un secteur dispose de plusieurs salles (blocs opératoires, salles de consultation).
    *   `Secteur` (N) --- (1) `SpecialiteChir` (optionnel) : Un secteur peut être associé à une spécialité chirurgicale requise.
    *   `Salle` (N) --- (1) `SpecialiteChir` (optionnel) : Une salle peut être spécifiquement associée à une spécialité chirurgicale.
    *   `Secteur` (N) --- (1) `Competence` (optionnel) : Un secteur peut requérir une compétence spécifique.


### 3. Planification et Affectations

*   **Entités :** `Planning`, `CreneauSalle`, `TypeAffectation`, `Affectation`, `Supervision`, `TrameChirurgien`

*   **Relations Clés :**
    *   `Planning` (N) --- (1) `Utilisateur` (généré par) : Un planning est généré par un utilisateur administrateur.
    *   `Affectation` (N) --- (1) `Planning` : Une affectation appartient à un planning spécifique.
    *   `CreneauSalle` (N) --- (1) `Salle` : Un créneau horaire est défini pour une salle spécifique.
    *   `Affectation` (N) --- (1) `Utilisateur` : Une affectation concerne un utilisateur (MAR, IADE).
    *   `Affectation` (N) --- (1) `CreneauSalle` : Une affectation est liée à un créneau horaire d\'une salle.
    *   `Affectation` (N) --- (1) `TypeAffectation` : Chaque affectation a un type (ex: Garde, Bloc, Consultation).
    *   `Supervision` (N) --- (1) `Utilisateur` (Superviseur) : Une supervision est assurée par un utilisateur.
    *   `Supervision` (N) --- (1) `Utilisateur` (Supervisé) : Une supervision concerne un utilisateur supervisé.
    *   `Supervision` (1) --- (1) `Affectation` (optionnel) : Une supervision peut être liée à une affectation spécifique.
    *   `TrameChirurgien` (N) --- (1) `Utilisateur` (Chirurgien) : Une entrée de trame chirurgien concerne un chirurgien.
    *   `TrameChirurgien` (N) --- (1) `Salle` : La trame chirurgien est définie pour une salle.
    *   `TrameChirurgien` (N) --- (1) `SpecialiteChir` (optionnel) : La trame peut spécifier une spécialité.

### 4. Gestion des Absences et Congés

*   **Entités :** `TypeAbsence`, `Absence`, `Conge`

*   **Relations Clés :**
    *   `Absence` (N) --- (1) `Utilisateur` : Une absence est posée par un utilisateur.
    *   `Absence` (N) --- (1) `TypeAbsence` : Chaque absence est d\'un type défini (ex: Maladie, Formation).
    *   `TypeAbsence` (N) --- (1) `CorpsMetier` (optionnel) : Un type d\'absence peut être spécifique à un corps de métier.
    *   `Conge` (N) --- (1) `Utilisateur` : Une demande de congé est faite par un utilisateur.
    *   `Absence` (N) --- (1) `Utilisateur` (validée par, optionnel) : Une absence peut être validée par un autre utilisateur.
    *   `Conge` (N) --- (1) `Utilisateur` (validé par, optionnel) : Un congé peut être validé par un autre utilisateur.


### 5. Demandes et Préférences Utilisateurs

*   **Entités :** `TypeRequete`, `Requete`, `PreferenceInterdit` (*`RequeteEchange` pourrait être ajoutée ici si activée*)

*   **Relations Clés :**
    *   `Requete` (N) --- (1) `Utilisateur` (soumise par) : Une requête est soumise par un utilisateur.
    *   `Requete` (N) --- (1) `TypeRequete` : Chaque requête est d\'un type spécifique (ex: demande de salle, demande de binôme).
    *   `TypeRequete` (N) --- (1) `CorpsMetier` (optionnel) : Un type de requête peut être spécifique à un corps de métier.
    *   `Requete` (N) --- (1) `Utilisateur` (traitée par, optionnel) : Une requête peut être traitée par un administrateur.
    *   `Requete` (N) --- (1) `Salle` (cible, optionnelle) : Une requête peut cibler une salle.
    *   `Requete` (N) --- (1) `Utilisateur` (cible, optionnel) : Une requête peut cibler un autre utilisateur.
    *   `PreferenceInterdit` (N) --- (1) `Utilisateur` : Un utilisateur peut définir des préférences ou interdits.
    *   `PreferenceInterdit` peut cibler un `Utilisateur`, une `Salle`, ou un `TypeAffectation`.

### 6. Informations Journalières et Disponibilités

*   **Entités :** `CommentaireJour`, `DisponibiliteRemplacant`

*   **Relations Clés :**
    *   `CommentaireJour` (N) --- (1) `Utilisateur` : Un utilisateur peut ajouter un commentaire pour une journée.
    *   `DisponibiliteRemplacant` (N) --- (1) `Utilisateur` (Remplaçant) : Un utilisateur remplaçant indique ses disponibilités.

### 7. Compteurs et Suivi d\'Activité

*   **Entités :** `CompteurHoraire`, `CompteurGarde`, `StatActivite`

*   **Relations Clés :**
    *   `CompteurHoraire` (N) --- (1) `Utilisateur` : Les heures sont comptabilisées par utilisateur.
    *   `CompteurGarde` (N) --- (1) `Utilisateur` : Les gardes sont comptabilisées par utilisateur.
    *   `StatActivite` est liée optionnellement à `Site`, `Secteur`, `Salle` pour agréger des données.

---

Ce diagramme conceptuel servira de base pour la création détaillée des tables et de leurs attributs dans le document `02_Description_Tables_Attributs.md`. 