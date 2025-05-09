# Diagramme Relationnel

Ce document présente le modèle relationnel de données de l'application MATHILDA, détaillant les entités principales et leurs relations.

**Note : Ce modèle exclut volontairement les données nominatives de patients et les détails des interventions chirurgicales.**

## Entités Principales

### 1. Utilisateurs, Rôles, Compétences et Spécialités

```
+------------------+       +------------------+       +------------------+
|    Utilisateur   |------>|       Rôle       |------>|    Permission    |
+------------------+       +------------------+       +------------------+
| id (PK)          |       | id (PK)          |       | id (PK)          |
| nom              |       | nom (Unique)     |       | nom (Unique)     |
| prenom           |       | description      |       | code (Unique)    |
| email (Unique)   |       | niveau_admin     |       | description      |
| mot_de_passe     |       | ...              |       +-------^----------+
| telephone        |       +--------^---------+
| actif            |                |
| role_id (FK)     |                |                +------------------+
| corps_metier_id (FK) |                +--------------->| RolePermission   |
| temps_travail    |                                 | role_id (FK, PK) |
| ...              |                                 | permission_id (FK, PK) |
+-------^--^-------+
        |  |
        |  |
+-------+--v-------+       +------------------+       +------------------+
|  Corps Métier    |<------| Utilisateur      |------>|  Specialite Chir |
+------------------+       |                  |       +------------------+
| id (PK)          |       |                  |       | id (PK)          |
| nom (Unique)     |       |                  |       | nom (Unique)     |
| description      |       +------------------+       | description      |
| couleur          |                |                  +-------^----------+
| type             |                |                          |
+------------------+                |                          |
                                      |  +-----------------------+ |
+------------------+                |  | UtilisateurSpecialite | |
|    Competence    |                |  | utilisateur_id (FK, PK)| |
+------------------+                |  | specialite_id (FK, PK)| |
| id (PK)          |                |  +-----------------------+ |
| nom (Unique)     |                |
| description      |<---------------+--------------------------+
+--------^---------+                |
         |                          |
         |  +-----------------------+       +------------------+
         |  | UtilisateurCompetence |       |  Disponibilite   |
         |  | utilisateur_id (FK, PK)|<----->|  Remplacant      |
         |  | competence_id (FK, PK)|       +------------------+
         |  +-----------------------+       | id (PK)          |
                                           | remplacant_id (FK)|
                                           | date             |
                                           | creneau          |
                                           | disponible       |
                                           +------------------+
```

### 2. Structure Organisationnelle (Sites, Secteurs, Salles)

```
+------------------+       +------------------+       +------------------+
|       Site       |------>|      Secteur     |------>|       Salle      |
+------------------+       +------------------+       +------------------+
| id (PK)          |       | id (PK)          |       | id (PK)          |
| nom (Unique)     |       | nom              |       | numero           |
| ...              |       | site_id (FK)     |       | nom              |
+------------------+       | type_activite    |       | secteur_id (FK)  |
                           | specialite_id (FK, nullable) | type             |
                           | ...              |       | statut           |
                           +------------------+       | visible_planning |
                                                      +------------------+
```

### 3. Planification, Affectations et Trame Chirurgien

```
+------------------+       +------------------+       +------------------+
|     Planning     |------>|    Affectation   |<------|    Utilisateur   |
+------------------+       +------------------+------>| (MAR/IADE)       |
| id (PK)          |       | id (PK)          |       +------------------+
| date_debut       |       | planning_id (FK) |
| date_fin         |       | utilisateur_id (FK)|
| statut           |       | creneau_salle_id (FK)|
| genere_par (FK)  |       | type_affectation |<--+  +------------------+
| ...              |       | statut           |   |  | Type Affectation |
+------------------+       | commentaire      |   +--| id (PK)          |
                           | remplace_id (FK) |      | nom (Unique)     |
                           | ...              |      | code             |
                           +--------^---------+      | corps_metier     |
                                    |                +------------------+
                                    |
+------------------+                |
|  Creneau Salle   |<---------------+----->+------------------+
+------------------+                     |       Salle      |
| id (PK)          |                     +------------------+
| date             |
| creneau          |
| heure_debut      |
| heure_fin        |
| salle_id (FK)    |
| statut           |
+--------^---------+
         |
+--------+---------+       +------------------+       +------------------+
| Trame Chirurgien |------>|   Utilisateur    |------>|    Specialite    |
+------------------+       |   (Chirurgien)   |       +------------------+
| id (PK)          |       +------------------+
| semaine_type     |
| utilisateur_id (FK)|
| creneau_salle_id (FK)|
| date_exception   |
+------------------+
```

### 4. Gestion des Absences et Congés (Inchangé)

```
+------------------+       +------------------+       +------------------+
|      Absence     |       |     Congé        |       |  Type Absence    |
+------------------+       +------------------+       +------------------+
| id               |       | id               |       | id               |
| utilisateur_id   |       | utilisateur_id   |       | nom              |
| date_debut       |       | date_debut       |       | description      |
| date_fin         |       | date_fin         |       | impact_compteur  |
| type_absence_id  |<----->| motif            |       | priorite         |
| commentaire      |       | statut           |       +------------------+
| statut           |       | valide_par       |
+------------------+       | date_validation  |
                           | commentaire_admin|
                           +------------------+
```

### 5. Requêtes, Préférences et Commentaires Journaliers

```
+------------------+       +------------------+       +------------------+
|      Requête     |------>|  Type Requête    |<------|  Corps Métier    |
+------------------+       +------------------+       +------------------+
| id (PK)          |
| utilisateur_id (FK)|
| type_requete_id (FK)|
| ...              |
+--------^---------+
         |
         |       +------------------+
         +------>| Requête Échange  |
                 +------------------+
                 | id (PK)          |
                 | requete_id (FK)  |
                 | ...              |
                 +------------------+

+------------------+       +------------------+       +------------------+
| PreferenceInterdit|------>|    Utilisateur   |------>|    Utilisateur   |
+------------------+       | (MAR/IADE)       |       | (Chirurgien)     |
| id (PK)          |       +------------------+       +------------------+
| utilisateur_id (FK)|            |                          |   
| type (pref/interdit)|          |                          |
| cible_type       |          |                          |
| cible_id         |          +-----------+------------------+
| commentaire      |                      |    Specialite    |
+------------------+                      +------------------+
                                            |                          |
                                            +-----------+------------------+
                                                        |    Competence    |
                                                        +------------------+

+------------------+       +------------------+
| CommentaireJour  |------>|    Utilisateur   |
+------------------+       +------------------+
| id (PK)          |
| date             |
| commentaire      |
| utilisateur_id (FK)|
| date_creation    |
+------------------+
```

### 6. Compteurs et Statistiques (Inchangé)

```
+------------------+       +------------------+       +------------------+
| Compteur Horaire |       | Compteur Garde   |       |  Stat Activité   |
+------------------+       +------------------+       +------------------+
| id               |       | id               |       | id               |
| utilisateur_id   |       | utilisateur_id   |       | date             |
| date             |       | annee            |       | type             |
| heures_effectuees|       | mois             |       | site_id          |
| commentaire      |       | gardes_semaine   |       | secteur_id       |
| valide           |       | gardes_weekend   |       | salle_id         |
| periode_id       |       | gardes_feries    |       | nb_affectations  |
+------------------+       | total_points     |       | taux_occupation  |
                           +------------------+       +------------------+
```

## Relations Principales (Mises à jour)

1. **Utilisateur - Rôle - Permission** : Un utilisateur a un rôle qui détermine ses permissions.
2. **Utilisateur - Corps Métier** : Un utilisateur appartient à un corps métier.
3. **Utilisateur - Compétence/Spécialité** : Un utilisateur peut avoir plusieurs compétences (MAR/IADE) ou spécialités (Chirurgien).
4. **Site - Secteur - Salle** : Structure hiérarchique. Une salle peut être associée à une spécialité.
5. **Planning - Affectation - CreneauSalle - Utilisateur** : Un planning contient des affectations d'un utilisateur (MAR/IADE) à un créneau dans une salle.
6. **Trame Chirurgien - Utilisateur (Chirurgien) - CreneauSalle - Spécialité** : Définit quel chirurgien est prévu dans quelle salle/créneau (donnée externe).
7. **Utilisateur - Absence/Congé** : Inchangé.
8. **Utilisateur - Requête/PreferenceInterdit** : Gestion des demandes spécifiques et des règles personnelles.
9. **Utilisateur - Compteurs** : Inchangé.
10. **CommentaireJour - Utilisateur** : Commentaires libres associés à une journée.
11. **DisponibiliteRemplacant - Utilisateur (Remplaçant)** : Gestion des disponibilités.

## Notes Techniques (Mises à jour)

- Renommage de `Vacation` en `CreneauSalle` pour éviter confusion avec la trame chirurgien.
- Ajout des tables `Competence`, `SpecialiteChir`, `UtilisateurCompetence`, `UtilisateurSpecialite`, `TrameChirurgien`, `PreferenceInterdit`, `CommentaireJour`, `DisponibiliteRemplacant`, `TypeAffectation`.
- Suppression des références à `Patient` ou `Intervention`.
- Les détails précis (types, contraintes) sont dans `02_Description_Tables.md`. 