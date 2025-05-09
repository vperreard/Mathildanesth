# Description des Tables

Ce document détaille les structures des tables de la base de données de l'application MATHILDA, incluant les champs, types de données, contraintes et relations entre tables.

## 1. Tables de Gestion des Utilisateurs

### 1.1 Table `utilisateurs`

Stocke les informations des utilisateurs du système.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom de famille                             | NOT NULL              |
| prenom             | VARCHAR(50)  | Prénom                                     | NOT NULL              |
| email              | VARCHAR(100) | Adresse email                              | UNIQUE, NOT NULL      |
| mot_de_passe       | VARCHAR(255) | Mot de passe hashé                         | NOT NULL              |
| telephone          | VARCHAR(20)  | Numéro de téléphone                        |                       |
| actif              | BOOLEAN      | Indique si le compte est actif             | DEFAULT TRUE          |
| date_creation      | DATETIME     | Date de création du compte                 | DEFAULT CURRENT_TIME  |
| derniere_connexion | DATETIME     | Date de dernière connexion                 |                       |
| role_id            | INT          | Référence au rôle de l'utilisateur         | FK -> roles.id        |
| corps_metier_id    | INT          | Référence au corps de métier               | FK -> corps_metiers.id|
| temps_travail      | FLOAT        | Pourcentage du temps de travail (100=plein)| DEFAULT 100           |
| specialite_chir_principale_id | INT | Spécialité principale (pour chirurgiens) | FK -> specialites_chir.id (nullable) |

### 1.2 Table `roles`

Définit les rôles disponibles dans le système.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom du rôle                                | UNIQUE, NOT NULL      |
| description        | TEXT         | Description du rôle                        |                       |
| niveau_admin       | INT          | Niveau d'administration (0-5)              | DEFAULT 0             |
| date_creation      | DATETIME     | Date de création du rôle                   | DEFAULT CURRENT_TIME  |

### 1.3 Table `permissions`

Stocke les permissions individuelles du système.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom de la permission                       | UNIQUE, NOT NULL      |
| code               | VARCHAR(50)  | Code technique de la permission            | UNIQUE, NOT NULL      |
| description        | TEXT         | Description de la permission               |                       |

### 1.4 Table `role_permissions`

Table de jonction entre rôles et permissions (relation many-to-many).

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| role_id            | INT          | Référence au rôle                          | PK, FK -> roles.id    |
| permission_id      | INT          | Référence à la permission                  | PK, FK -> permissions.id |

### 1.5 Table `corps_metiers`

Définit les différents corps de métier (MAR, IADE, etc.).

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom du corps de métier                     | UNIQUE, NOT NULL      |
| description        | TEXT         | Description du corps de métier             |                       |
| couleur            | VARCHAR(7)   | Code couleur pour l'interface              | DEFAULT '#FFFFFF'     |
| type               | VARCHAR(20)  | Type de corps (medical, paramedical, etc.) |                       |

### 1.6 Table `competences`

Stocke les compétences spécifiques du personnel MAR/IADE.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom de la compétence                       | UNIQUE, NOT NULL      |
| description        | TEXT         | Description de la compétence               |                       |

### 1.7 Table `utilisateur_competences`

Table de jonction entre utilisateurs (MAR/IADE) et compétences.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| utilisateur_id     | INT          | Référence à l'utilisateur                  | PK, FK -> utilisateurs.id |
| competence_id      | INT          | Référence à la compétence                  | PK, FK -> competences.id |

### 1.8 Table `specialites_chir`

Stocke les spécialités chirurgicales.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom de la spécialité                       | UNIQUE, NOT NULL      |
| description        | TEXT         | Description de la spécialité               |                       |

### 1.9 Table `utilisateur_specialites`

Table de jonction entre utilisateurs (chirurgiens) et spécialités.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| utilisateur_id     | INT          | Référence à l'utilisateur (chirurgien)     | PK, FK -> utilisateurs.id |
| specialite_id      | INT          | Référence à la spécialité                  | PK, FK -> specialites_chir.id |

## 2. Tables de Structure Organisationnelle

### 2.1 Table `sites`

Définit les sites physiques (cliniques, hôpitaux).

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(100) | Nom du site                                | UNIQUE, NOT NULL      |
| adresse            | TEXT         | Adresse physique                           |                       |
| telephone          | VARCHAR(20)  | Numéro de téléphone                        |                       |
| contact            | VARCHAR(100) | Contact principal                          |                       |
| actif              | BOOLEAN      | Indique si le site est actif               | DEFAULT TRUE          |

### 2.2 Table `secteurs`

Définit les secteurs au sein d'un site.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom du secteur                             | NOT NULL              |
| description        | TEXT         | Description du secteur                     |                       |
| site_id            | INT          | Référence au site parent                   | FK -> sites.id        |
| type_activite      | VARCHAR(50)  | Type d'activité                            |                       |
| horaire_ouverture  | TIME         | Heure d'ouverture                          | DEFAULT '08:00:00'    |
| horaire_fermeture  | TIME         | Heure de fermeture                         | DEFAULT '18:30:00'    |
| couleur            | VARCHAR(7)   | Code couleur pour l'interface              | DEFAULT '#FFFFFF'     |
| actif              | BOOLEAN      | Indique si le secteur est actif            | DEFAULT TRUE          |
| specialite_requise_id | INT        | Spécialité requise pour ce secteur       | FK -> specialites_chir.id (nullable) |
| competence_requise_id | INT      | Compétence requise pour ce secteur       | FK -> competences.id (nullable) |

### 2.3 Table `salles`

Définit les salles au sein d'un secteur.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| numero             | VARCHAR(10)  | Numéro/identifiant de la salle             | NOT NULL              |
| nom                | VARCHAR(50)  | Nom descriptif                             |                       |
| secteur_id         | INT          | Référence au secteur parent                | FK -> secteurs.id     |
| type               | VARCHAR(50)  | Type de salle                              |                       |
| equipement         | TEXT         | Équipement spécifique                      |                       |
| statut             | VARCHAR(20)  | Statut (active, inactive, urgence, etc.)   | DEFAULT 'active'      |
| visible_planning   | BOOLEAN      | Visible sur le planning standard           | DEFAULT TRUE          |
| specialite_associee_id | INT     | Spécialité associée à la salle           | FK -> specialites_chir.id (nullable) |

## 3. Tables de Planification

### 3.1 Table `plannings`

Stocke les informations sur les plannings générés.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| date_debut         | DATE         | Date de début du planning                  | NOT NULL              |
| date_fin           | DATE         | Date de fin du planning                    | NOT NULL              |
| statut             | VARCHAR(20)  | Statut (brouillon, publié, archivé)        | DEFAULT 'brouillon'   |
| genere_par         | INT          | Utilisateur ayant généré le planning       | FK -> utilisateurs.id |
| date_generation    | DATETIME     | Date de génération                         | DEFAULT CURRENT_TIME  |
| date_publication   | DATETIME     | Date de publication                        |                       |
| version            | INT          | Version du planning                        | DEFAULT 1             |
| commentaire        | TEXT         | Commentaire sur le planning                |                       |

### 3.2 Table `creneaux_salle` (Anciennement `vacations`)

Définit les créneaux horaires disponibles dans les salles.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| date               | DATE         | Date du créneau                            | NOT NULL              |
| creneau            | VARCHAR(20)  | Créneau (matin, après-midi, garde, etc.)   | NOT NULL              |
| heure_debut        | TIME         | Heure de début                             | NOT NULL              |
| heure_fin          | TIME         | Heure de fin                               | NOT NULL              |
| salle_id           | INT          | Salle concernée                            | FK -> salles.id       |
| statut             | VARCHAR(20)  | Statut (disponible, complet, fermé, etc.) | DEFAULT 'disponible'  |

### 3.3 Table `affectations`

Associe un utilisateur (MAR/IADE) à un créneau/salle dans le cadre d'un planning.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| planning_id        | INT          | Référence au planning                      | FK -> plannings.id    |
| utilisateur_id     | INT          | Utilisateur affecté (MAR/IADE)             | FK -> utilisateurs.id |
| creneau_salle_id   | INT          | Créneau/Salle concerné                     | FK -> creneaux_salle.id|
| type_affectation_id | INT          | Type d'affectation (Anesthésie, Supervision...)| FK -> types_affectation.id | NOT NULL |
| statut             | VARCHAR(20)  | Statut (confirmé, modifié, etc.)           | DEFAULT 'confirmé'    |
| date_creation      | DATETIME     | Date de création de l'affectation          | DEFAULT CURRENT_TIME  |
| cree_par           | INT          | Utilisateur ayant créé l'affectation       | FK -> utilisateurs.id |
| commentaire        | TEXT         | Commentaire sur l'affectation              |                       |
| remplace_id        | INT          | Affectation remplacée (historique)         | FK -> affectations.id |

### 3.4 Table `supervision`

Définit les relations de supervision entre utilisateurs.

| Champ              | Type         | Description                                | Contraintes                |
|--------------------|--------------|--------------------------------------------|-----------------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT         |
| superviseur_id     | INT          | Utilisateur superviseur                    | FK -> utilisateurs.id      |
| supervise_id       | INT          | Utilisateur supervisé                      | FK -> utilisateurs.id      |
| affectation_id     | INT          | Affectation concernée                      | FK -> affectations.id      |
| date_creation      | DATETIME     | Date de création                           | DEFAULT CURRENT_TIME       |

### 3.5 Table `trame_chirurgiens`

Stocke la trame d'affectation des chirurgiens aux salles/créneaux (donnée externe).

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| semaine_type       | VARCHAR(10)  | Type de semaine (paire, impaire, specifique) | NOT NULL           |
| jour_semaine       | INT          | Jour de la semaine (1=Lundi...)            | NOT NULL              |
| creneau            | VARCHAR(20)  | Créneau (matin, après-midi)                | NOT NULL              |
| utilisateur_id     | INT          | Chirurgien concerné                        | FK -> utilisateurs.id |
| salle_id           | INT          | Salle attribuée                            | FK -> salles.id       |
| date_exception     | DATE         | Si cette entrée s'applique à une date précise | UNIQUE (nullable)     |
| commentaire        | TEXT         | Commentaire sur cette affectation trame    |                       |

### 3.6 Table `types_affectation`

Définit les différents types d'affectations possibles.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom du type (Anesthésie, Supervision, Garde...) | UNIQUE, NOT NULL |
| code               | VARCHAR(20)  | Code court (ANESTH, SUPERV, GARDE_M...)    | UNIQUE, NOT NULL      |
| description        | TEXT         | Description                                |                       |
| corps_metier       | VARCHAR(10)  | Corps métier concerné (MAR, IADE, BOTH)   | NOT NULL              |

## 4. Tables de Gestion des Absences

### 4.1 Table `types_absence`

Définit les différents types d'absence possibles.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom du type d'absence                      | UNIQUE, NOT NULL      |
| description        | TEXT         | Description                                |                       |
| impact_compteur    | BOOLEAN      | Impact sur le compteur horaire             | DEFAULT FALSE         |
| priorite           | INT          | Priorité dans la planification             | DEFAULT 0             |
| corps_metier_id    | INT          | Corps de métier concerné (NULL=tous)       | FK -> corps_metiers.id|

### 4.2 Table `absences`

Stocke les absences hors congés validés.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| utilisateur_id     | INT          | Utilisateur concerné                       | FK -> utilisateurs.id |
| date_debut         | DATETIME     | Date et heure de début                     | NOT NULL              |
| date_fin           | DATETIME     | Date et heure de fin                       | NOT NULL              |
| type_absence_id    | INT          | Type d'absence                             | FK -> types_absence.id|
| commentaire        | TEXT         | Commentaire/motif                          |                       |
| statut             | VARCHAR(20)  | Statut (enregistrée, etc.)                 | DEFAULT 'enregistrée' |
| date_creation      | DATETIME     | Date de création                           | DEFAULT CURRENT_TIME  |

### 4.3 Table `conges`

Stocke les demandes et validation de congés.

| Champ              | Type         | Description                                | Contraintes            |
|--------------------|--------------|-------------------------------------------|------------------------|
| id                 | INT          | Identifiant unique                        | PK, AUTO_INCREMENT     |
| utilisateur_id     | INT          | Utilisateur demandeur                     | FK -> utilisateurs.id  |
| date_debut         | DATE         | Date de début                             | NOT NULL               |
| date_fin           | DATE         | Date de fin                               | NOT NULL               |
| motif              | VARCHAR(100) | Motif du congé                            |                        |
| statut             | VARCHAR(20)  | Statut (demandé, validé, refusé)          | DEFAULT 'demandé'      |
| date_demande       | DATETIME     | Date de la demande                        | DEFAULT CURRENT_TIME   |
| valide_par         | INT          | Utilisateur validant                      | FK -> utilisateurs.id  |
| date_validation    | DATETIME     | Date de validation/refus                  |                        |
| commentaire_admin  | TEXT         | Commentaire administrateur                |                        |

## 5. Tables de Requêtes et Préférences

### 5.1 Table `types_requete`

Définit les différents types de requêtes possibles.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom du type de requête                     | UNIQUE, NOT NULL      |
| description        | TEXT         | Description                                |                       |
| priorite           | INT          | Priorité dans la planification             | DEFAULT 0             |
| corps_metier_id    | INT          | Corps de métier concerné (NULL=tous)       | FK -> corps_metiers.id|

### 5.2 Table `requetes`

Stocke les requêtes spécifiques des utilisateurs.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| utilisateur_id     | INT          | Utilisateur demandeur                      | FK -> utilisateurs.id |
| type_requete_id    | INT          | Type de requête                            | FK -> types_requete.id|
| date_creation      | DATETIME     | Date de création                           | DEFAULT CURRENT_TIME  |
| contenu            | TEXT         | Contenu de la requête                      | NOT NULL              |
| date_debut         | DATE         | Date de début d'application                | NOT NULL              |
| date_fin           | DATE         | Date de fin d'application                  | NOT NULL              |
| priorite           | INT          | Priorité utilisateur                       | DEFAULT 0             |
| statut             | VARCHAR(20)  | Statut (soumise, validée, refusée)         | DEFAULT 'soumise'     |
| valide_par         | INT          | Utilisateur validant                       | FK -> utilisateurs.id |
| date_validation    | DATETIME     | Date de validation/refus                   |                       |
| reponse_admin      | TEXT         | Réponse de l'administrateur                |                       |

### 5.3 Table `requetes_echange`

Stocke les demandes d'échange d'affectation.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| requete_id         | INT          | Référence à la requête parente             | FK -> requetes.id     |
| affectation_id     | INT          | Affectation à échanger                     | FK -> affectations.id |
| affectation_cible  | INT          | Affectation souhaitée en échange           | FK -> affectations.id |
| utilisateur_cible  | INT          | Utilisateur concerné par l'échange         | FK -> utilisateurs.id |
| statut             | VARCHAR(20)  | Statut (demandé, accepté, refusé)          | DEFAULT 'demandé'     |
| date_reponse       | DATETIME     | Date de réponse                            |                       |
| reponse            | TEXT         | Réponse du destinataire                    |                       |

### 5.4 Table `preferences_interdits`

Stocke les règles de préférences ou d'interdits pour les affectations.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| utilisateur_id     | INT          | Utilisateur MAR/IADE concerné              | FK -> utilisateurs.id |
| type               | VARCHAR(10)  | Type de règle ('preference', 'interdit')  | NOT NULL              |
| cible_type         | VARCHAR(20)  | Type de cible (chirurgien, specialite, competence, secteur, salle) | NOT NULL |
| cible_id           | INT          | ID de la cible (selon cible_type)          | NOT NULL              |
| commentaire        | TEXT         | Justification / note                       |                       |
| date_debut         | DATE         | Date de début d'application (optionnel)    |                       |
| date_fin           | DATE         | Date de fin d'application (optionnel)      |                       |

### 5.5 Table `commentaires_journaliers`

Stocke les commentaires libres associés à une journée.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| date               | DATE         | Journée concernée                          | NOT NULL              |
| commentaire        | TEXT         | Texte du commentaire                       | NOT NULL              |
| utilisateur_id     | INT          | Auteur du commentaire                      | FK -> utilisateurs.id |
| date_creation      | DATETIME     | Date de création                           | DEFAULT CURRENT_TIME  |

### 5.6 Table `disponibilites_remplacants`

Stocke les disponibilités déclarées par les remplaçants.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| remplacant_id      | INT          | Utilisateur remplaçant concerné            | FK -> utilisateurs.id |
| date               | DATE         | Journée de disponibilité                   | NOT NULL              |
| creneau_matin      | BOOLEAN      | Disponible le matin                        | DEFAULT FALSE         |
| creneau_aprem      | BOOLEAN      | Disponible l'après-midi                   | DEFAULT FALSE         |
| commentaire        | TEXT         | Note additionnelle                         |                       |
| date_mise_a_jour   | DATETIME     | Date de dernière mise à jour               | DEFAULT CURRENT_TIME  |

## 6. Tables de Compteurs et Statistiques

### 6.1 Table `compteur_horaire`

Suivi des heures effectuées par les utilisateurs.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| utilisateur_id     | INT          | Utilisateur concerné                       | FK -> utilisateurs.id |
| date               | DATE         | Date d'enregistrement                      | NOT NULL              |
| heures_effectuees  | FLOAT        | Nombre d'heures effectuées                 | NOT NULL              |
| commentaire        | TEXT         | Commentaire                                |                       |
| valide             | BOOLEAN      | Validation du compteur                     | DEFAULT FALSE         |
| valide_par         | INT          | Validé par                                 | FK -> utilisateurs.id |
| date_validation    | DATETIME     | Date de validation                         |                       |
| periode_id         | INT          | Période comptable                          | FK -> periodes.id     |

### 6.2 Table `compteur_garde`

Suivi des gardes effectuées par les utilisateurs.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| utilisateur_id     | INT          | Utilisateur concerné                       | FK -> utilisateurs.id |
| annee              | INT          | Année                                      | NOT NULL              |
| mois               | INT          | Mois (1-12)                                | NOT NULL              |
| gardes_semaine     | INT          | Nombre de gardes en semaine                | DEFAULT 0             |
| gardes_weekend     | INT          | Nombre de gardes en weekend                | DEFAULT 0             |
| gardes_feries      | INT          | Nombre de gardes jours fériés              | DEFAULT 0             |
| total_points       | INT          | Total des points (pondération)             | DEFAULT 0             |
| commentaire        | TEXT         | Commentaire                                |                       |
| type_garde         | VARCHAR(10)  | Type de garde (MAR, IADE)                  | NOT NULL DEFAULT 'MAR' |

### 6.3 Table `periodes`

Définit les périodes comptables pour le suivi horaire.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| nom                | VARCHAR(50)  | Nom de la période                          | NOT NULL              |
| date_debut         | DATE         | Date de début                              | NOT NULL              |
| date_fin           | DATE         | Date de fin                                | NOT NULL              |
| statut             | VARCHAR(20)  | Statut (ouverte, fermée, etc.)             | DEFAULT 'ouverte'     |

### 6.4 Table `statistiques_activite`

Stocke les statistiques d'activité agrégées.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| date               | DATE         | Date des statistiques                      | NOT NULL              |
| type               | VARCHAR(50)  | Type de statistique                        | NOT NULL              |
| site_id            | INT          | Site concerné                              | FK -> sites.id        |
| secteur_id         | INT          | Secteur concerné                           | FK -> secteurs.id     |
| salle_id           | INT          | Salle concernée                            | FK -> salles.id       |
| nb_affectations    | INT          | Nombre d'affectations                      | DEFAULT 0             |
| taux_occupation    | FLOAT        | Taux d'occupation (%)                      | DEFAULT 0             |
| commentaire        | TEXT         | Commentaire                                |                       |

### 6.5 Table `compteur_penibilite`

Stocke les points de pénibilité accumulés par période.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| utilisateur_id     | INT          | Utilisateur concerné                       | FK -> utilisateurs.id |
| periode_id         | INT          | Période concernée                          | FK -> periodes.id     |
| total_points       | INT          | Total des points de pénibilité accumulés   | DEFAULT 0             |
| commentaire        | TEXT         | Note                                       |                       |

### 6.6 Table `compteur_fermeture_iade`

Stocke le décompte des fermetures pour l'équité IADE.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| utilisateur_id     | INT          | IADE concerné                              | FK -> utilisateurs.id |
| annee              | INT          | Année                                      | NOT NULL              |
| mois               | INT          | Mois                                       | NOT NULL              |
| nb_fermetures      | INT          | Nombre total de fermetures                 | DEFAULT 0             |
| nb_fermetures_vendredi | INT      | Dont fermetures le vendredi                | DEFAULT 0             |

## 7. Tables de Configuration

### 7.1 Table `regles_affectation`

Stocke les règles d'affectation par secteur.

| Champ                  | Type         | Description                                | Contraintes           |
|------------------------|--------------|--------------------------------------------|-----------------------|
| id                     | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| secteur_id             | INT          | Secteur concerné                           | FK -> secteurs.id     |
| max_salles_par_iade    | INT          | Nombre max de salles par IADE              | DEFAULT 1             |
| max_salles_par_mar     | INT          | Nombre max de salles par MAR               | DEFAULT 1             |
| max_supervision_par_mar| INT          | Nombre max de supervision par MAR          | DEFAULT 2             |
| continuite_matin_aprem | BOOLEAN      | Continuité matin/après-midi obligatoire    | DEFAULT FALSE         |
| description            | TEXT         | Description de la règle                    |                       |
| actif                  | BOOLEAN      | Règle active                               | DEFAULT TRUE          |

### 7.2 Table `jours_feries`

Stocke les jours fériés et spéciaux.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| date               | DATE         | Date du jour férié                         | UNIQUE, NOT NULL      |
| nom                | VARCHAR(100) | Nom du jour férié                          | NOT NULL              |
| type               | VARCHAR(50)  | Type (férié, pont, etc.)                   | DEFAULT 'férié'       |
| recurrent          | BOOLEAN      | Récurrent chaque année                     | DEFAULT TRUE          |
| points_garde       | INT          | Points attribués pour garde ce jour        | DEFAULT 2             |

### 7.3 Table `parametres_systeme`

Stocke les paramètres généraux du système.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| cle                | VARCHAR(50)  | Clé du paramètre                           | UNIQUE, NOT NULL      |
| valeur             | TEXT         | Valeur du paramètre                        | NOT NULL              |
| description        | TEXT         | Description du paramètre                   |                       |
| type               | VARCHAR(20)  | Type de donnée                             | DEFAULT 'string'      |
| categorie          | VARCHAR(50)  | Catégorie du paramètre                     |                       |
| modifiable         | BOOLEAN      | Paramètre modifiable via interface         | DEFAULT TRUE          |

### 7.4 Table `config_points_penibilite`

Stocke la configuration des points attribués par type d'activité/contexte.

| Champ              | Type         | Description                                | Contraintes           |
|--------------------|--------------|--------------------------------------------|-----------------------|
| id                 | INT          | Identifiant unique                         | PK, AUTO_INCREMENT    |
| code_activite      | VARCHAR(50)  | Code identifiant l'activité (SUPERV_2, GARDE_WE...) | UNIQUE, NOT NULL |
| points             | INT          | Nombre de points attribués                 | NOT NULL DEFAULT 0    |
| description        | TEXT         | Description de la règle                    |                       |
| actif              | BOOLEAN      | Règle active                               | DEFAULT TRUE          |

## Notes et Contraintes Additionnelles

1. **Indexation** : Des index seront créés sur les colonnes fréquemment utilisées pour les recherches, notamment les clés étrangères et les dates.

2. **Contraintes d'intégrité** : 
   - Des contraintes `ON DELETE` et `ON UPDATE` seront définies pour toutes les clés étrangères
   - Des contraintes de vérification (CHECK) seront ajoutées pour les champs critiques

3. **Triggers et procédures stockées** :
   - Des triggers seront mis en place pour maintenir l'intégrité des données (ex: mise à jour des compteurs)
   - Des procédures stockées seront créées pour les opérations complexes sur les données

4. **Historisation** :
   - Un mécanisme d'historisation sera implémenté pour les tables importantes (affectations, plannings) via des tables d'historique dédiées

5. **Évolutivité** :
   - La structure est conçue pour être extensible et permettre l'ajout de nouveaux types d'utilisateurs ou de règles sans modification majeure du schéma 