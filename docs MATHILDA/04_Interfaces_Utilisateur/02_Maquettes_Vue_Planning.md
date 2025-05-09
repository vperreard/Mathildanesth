# Maquettes Vue Planning

Ce document présente les maquettes détaillées de l'interface de planning, la vue principale de l'application MATHILDA.

## 1. Vue Principale Planning Hebdomadaire

```
+---------------------------------------------------------------------------------------------------------------------+
|                                                                                                                     |
|  MATHILDA                [Utilisateur: Dr Martin]        [Notifications (3)]           [Admin ▼]     [Déconnexion]  |
|                                                                                                                     |
+------------------------------+----------------------------+--------------------------------------------------+-------+
|                              |                            |                                                  |       |
| [◀ Semaine Préc.]  SEM 23   |  [Mois] [Semaine] [Jour]   |  [Mes Affectations ▼]   [Filtrer ▼]  [Recherche]| [?]   |
|  [5-11 Juin 2023]  [Suiv. ▶] |                            |                                                  |       |
+------------------------------+----------------------------+--------------------------------------------------+-------+
|              | ⬤ Dr Martin        | Compteurs:  Gardes: 2 | WE: 1/4 | Pts Pénib.: 35 | [Historique][Réinitialiser] |
+--------------+-------------------+---------------------------------------------------------------------+-------+
|              |     LUNDI         |    MARDI      |   MERCREDI     |     JEUDI     |   VENDREDI   | SAM | DIM |
|              |     05/06         |    06/06      |    07/06       |     08/06     |    09/06     | 10  | 11  |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
|              |                  |                |                |               |              |     |     |
| SITE PRINCIPAL                                                                                              |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
| HYPERASEPTIQUE|                 |                |                |               |              |     |     |
|              |                  |                |                |               |              |     |     |
| Salle 1      |  Dr Dubois       |  Dr Martin     |   Dr Dubois    |  Dr Petit     |  Dr Dupont   | --- | --- |
|              |  8h30-16h30      |  8h30-16h30    |   8h30-16h30   |  8h30-16h30   |  8h30-16h30  |     |     |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
| Salle 2      |  Dr Martin       |  Dr Petit      |   Dr Martin    |  Dr Dupont    |  Dr Martin   | --- | --- |
|              |  8h30-16h30      |  8h30-16h30    |   8h30-16h30   |  8h30-16h30   |  8h30-16h30  |     |     |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
| Salle 3      |  Dr Petit        |  Dr Dupont     |   Dr Petit     |  Dr Martin    |  Dr Dubois   | --- | --- |
|              |  8h30-16h30      |  8h30-16h30    |   8h30-16h30   |  8h30-16h30   |  8h30-16h30  |     |     |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
| Salle 4      |  Dr Dupont       |  Dr Dubois     |   Dr Dupont    |  Dr Dubois    |  Dr Petit    | --- | --- |
|              |  8h30-16h30      |  8h30-16h30    |   8h30-16h30   |  8h30-16h30   |  8h30-16h30  |     |     |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
|              |                  |                |                |               |              |     |     |
| OPHTALMO     |                  |                |                |               |              |     |     |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
| Salle 5      |  Dr Leroy        |  Dr Leroy      |   Dr Leroy     |  Dr Leroy     |  Dr Leroy    | --- | --- |
|              |  8h30-16h30      |  8h30-16h30    |   8h30-16h30   |  8h30-16h30   |  8h30-16h30  |     |     |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
| GARDES       |  Dr Petit        |  Dr Dupont     |   Dr Martin    |  Dr Dubois    |  Dr Martin   | ✓   | ✓   |
| Site Princ.  |  16h30-8h30      |  16h30-8h30    |   16h30-8h30   |  16h30-8h30   |  16h30-8h30  |     |     |
+--------------+------------------+----------------+----------------+---------------+--------------+-----+-----+
|                                                                                                              |
|                  [Exporter] [Imprimer] [Générer Planning (Admin)]     [Publier Version (Admin)]              |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
```

## 2. Explications des Éléments de l'Interface

### 2.1 Entête

- **Barre de navigation principale** : Logo, nom de l'utilisateur connecté, icône notifications, menu administration, bouton déconnexion
- **Sélecteur de période** : Navigation semaine précédente/suivante, indication semaine en cours (numéro et dates)
- **Sélecteur de vue** : Boutons pour basculer entre vues Mois, Semaine, Jour
- **Filtres rapides** : Menu déroulant "Mes Affectations" (toutes, mes assignations uniquement, mes congés, mes gardes...)
- **Filtre avancé** : Bouton ouvrant une fenêtre modale avec options de filtrage multiples (par secteur, par type d'assignation...)
- **Recherche** : Champ de recherche rapide (par nom de médecin, par salle...)
- **Aide** : Bouton d'aide contextuelle

### 2.2 Infobarre utilisateur

- **Indicateur utilisateur** : Nom et couleur associée
- **Compteurs** : Affichage des principaux compteurs d'équité (Gardes, Week-ends, Points de pénibilité)
- **Actions compteurs** : Boutons pour voir l'historique des compteurs ou réinitialiser la vue

### 2.3 Grille du planning

- **Entêtes de colonnes** : Jours de la semaine avec dates
- **Entêtes de lignes** : Hiérarchie Site > Secteur > Salle
- **Cellules d'affectation** : 
  - Nom du personnel affecté
  - Horaires
  - Couleur selon type d'affectation (bloc standard, garde, astreinte...)
- **Section Gardes/Astreintes** : Affichage séparé en bas de la grille

### 2.4 Actions

- **Boutons d'action** : Exporter (vers Excel/PDF), Imprimer
- **Boutons administrateur** : Générer Planning, Publier Version

## 3. Interactions et Comportements

### 3.1 Survol et Clic

- **Survol d'une affectation** : Infobulle avec détails complets (type précis, compétences requises, notes...)
- **Clic sur une affectation** : Ouvre un panneau latéral avec détails et options (modifier, supprimer, proposer échange...)
- **Clic droit sur une affectation** : Menu contextuel (voir détails, modifier, échanger, signaler problème...)
- **Clic sur cellule vide (Admin)** : Propose de créer une nouvelle affectation à cet emplacement

### 3.2 Glisser-déposer (Admin)

- **Déplacement d'affectation** : Glisser une affectation vers un autre jour/salle
- **Feedback visuel** : 
  - Cellule d'origine : contour en pointillés
  - Cellule cible : surlignage vert si compatible, rouge si incompatible
  - Infobulle de validation/erreur expliquant les contraintes non respectées

### 3.3 Gestion des Conflits (Admin)

- **Affichage des conflits** : Cellules avec bordure rouge, icône d'avertissement
- **Résolution assistée** : 
  - Suggestion de personnel disponible (menu déroulant sur clic)
  - Explication du conflit (règles violées)
  - Options de résolution (ignorer, trouver remplaçant, ajuster horaires...)

## 4. Vue Planning Mensuel (Alternative)

```
+---------------------------------------------------------------------------------------------------------------------+
|                                                                                                                     |
|  MATHILDA                [Utilisateur: Dr Martin]        [Notifications (3)]           [Admin ▼]     [Déconnexion]  |
|                                                                                                                     |
+------------------------------+----------------------------+--------------------------------------------------+-------+
|                              |                            |                                                  |       |
| [◀ Mois Préc.]   JUIN 2023  |  [Mois] [Semaine] [Jour]   |  [Mes Affectations ▼]   [Filtrer ▼]  [Recherche]| [?]   |
|               [Mois Suiv. ▶] |                            |                                                  |       |
+------------------------------+----------------------------+--------------------------------------------------+-------+
|              | ⬤ Dr Martin        | Compteurs:  Gardes: 2 | WE: 1/4 | Pts Pénib.: 35 | [Historique][Réinitialiser] |
+--------------+-------------------+---------------------------------------------------------------------+-------+
|              |     Lun   |   Mar   |   Mer   |   Jeu   |   Ven   |   Sam   |   Dim   |                           |
+--------------+----------+--------+--------+--------+--------+--------+--------+---------------------------+
|              |                                                                |                           |
| Semaine 22   |  29/05   |  30/05  |  31/05  |  01/06  |  02/06  |  03/06  |  04/06  |                           |
+--------------+----------+--------+--------+--------+--------+--------+--------+---------------------------+
| HYPERASEP.   |  Salle 1 |  Sal.2  |  Sal.3  |  Sal.1  |  Sal.2  |   ---   |   ---   |                           |
|              |                                                                |                           |
+--------------+----------+--------+--------+--------+--------+--------+--------+---------------------------+
| OPHTALMO     |  Salle 5 |  Sal.5  |  Sal.5  |  Sal.5  |  Sal.5  |   ---   |   ---   | [Légende des couleurs]   |
|              |                                                                |                           |
+--------------+----------+--------+--------+--------+--------+--------+--------+ ■ Bloc standard           |
| GARDE        |    ---   |   ---   |   ---   |   ---   |   ---   |   ---   |   ---   | ■ Garde                  |
|              |                                                                | ■ Astreinte               |
+--------------+----------+--------+--------+--------+--------+--------+--------+ ■ Formation               |
|              |                                                                | ■ Congé                   |
| Semaine 23   |  05/06   |  06/06  |  07/06  |  08/06  |  09/06  |  10/06  |  11/06  | ■ Indisponibilité        |
+--------------+----------+--------+--------+--------+--------+--------+--------+---------------------------+
| HYPERASEP.   |  Salle 2 |  Sal.1  |  Sal.2  |  Sal.3  |  Sal.2  |   ---   |   ---   |                           |
|              |                                                                |                           |
+--------------+----------+--------+--------+--------+--------+--------+--------+---------------------------+
| OPHTALMO     |    ---   |   ---   |   ---   |   ---   |   ---   |   ---   |   ---   |                           |
|              |                                                                |                           |
+--------------+----------+--------+--------+--------+--------+--------+--------+---------------------------+
| GARDE        |    ✓     |   ---   |    ✓    |   ---   |    ✓    |    ✓    |   ---   |                           |
|              |                                                                |                           |
+--------------+----------+--------+--------+--------+--------+--------+--------+---------------------------+
|                                                                                                              |
|                  [Exporter] [Imprimer] [Générer Planning (Admin)]     [Publier Version (Admin)]              |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
```

## 5. Fenêtres Modales et Dialogues

### 5.1 Détails d'une Affectation (Modal)

```
+--------------------------------------------------+
| Détails de l'Affectation                    [X]  |
+--------------------------------------------------+
| Date: 05/06/2023                                 |
| Horaires: 8h30 - 16h30                           |
| Type: Bloc Standard                              |
|                                                  |
| Personnel: Dr Martin                             |
| Salle: Salle 2 (Hyperaseptique)                  |
|                                                  |
| Compétences requises:                            |
| - Pédiatrie (Niveau: Expert)                     |
| - Chirurgie cardiaque (Niveau: Intermédiaire)    |
|                                                  |
| Notes: Patient difficile, supervision stagiaire   |
|                                                  |
| Historique:                                      |
| - Créé le 01/06/2023 par Admin                  |
| - Modifié le 03/06/2023 (changement de salle)   |
|                                                  |
+--------------------------------------------------+
|  [Modifier]  [Échanger]  [Supprimer]  [Fermer]   |
+--------------------------------------------------+
```

### 5.2 Filtres Avancés (Modal)

```
+--------------------------------------------------+
| Filtres Avancés                             [X]  |
+--------------------------------------------------+
| Période:                                         |
| Du: [05/06/2023] Au: [11/06/2023]               |
|                                                  |
| Personnel:                                       |
| [x] Tous  [ ] Dr Martin  [ ] Dr Dubois          |
| [ ] Dr Petit  [ ] Dr Dupont  [ ] Dr Leroy       |
|                                                  |
| Sites:                                          |
| [x] Site Principal  [ ] Site Secondaire         |
|                                                  |
| Secteurs:                                        |
| [x] Hyperaseptique  [x] Ophtalmo                |
| [ ] Endoscopie                                   |
|                                                  |
| Types d'affectation:                           |
| [x] Bloc standard  [x] Garde  [x] Astreinte     |
| [ ] Congé  [ ] Formation  [ ] Indisponibilité   |
|                                                  |
| Statut:                                         |
| [x] Publiées  [ ] Brouillon  [ ] Archivées      |
|                                                  |
+--------------------------------------------------+
|     [Réinitialiser]           [Appliquer]        |
+--------------------------------------------------+
```

### 5.3 Création/Modification d'Affectation (Admin) (Modal)

```
+--------------------------------------------------+
| Modifier Affectation                        [X]  |
+--------------------------------------------------+
| Date*: [05/06/2023]                             |
|                                                  |
| Horaires*: De [08:30] À [16:30]                 |
|                                                  |
| Type d'affectation*:                           |
| [Bloc standard ▼]                              |
|                                                  |
| Personnel*:                                     |
| [Dr Martin ▼]                                   |
|                                                  |
| Site*:                                          |
| [Site Principal ▼]                             |
|                                                  |
| Secteur*:                                       |
| [Hyperaseptique ▼]                             |
|                                                  |
| Salle*:                                         |
| [Salle 2 ▼]                                     |
|                                                  |
| Compétences requises:                           |
| [+ Ajouter une compétence]                      |
| - Pédiatrie (Expert) [X]                        |
| - Chirurgie cardiaque (Intermédiaire) [X]      |
|                                                  |
| Notes: [                                        ]|
|        [                                        ]|
|                                                  |
+--------------------------------------------------+
| [Vérifier Contraintes]    [Annuler]   [Enregistrer] |
+--------------------------------------------------+
```

## 6. Modes Alternatifs

### 6.1 Vue par Personnel

Affichage avec les personnels (MARs, IADEs) en lignes et les jours en colonnes. Particulièrement utile pour voir les affectations d'une personne spécifique.

### 6.2 Vue Journalière Détaillée

Vue plus détaillée d'une journée avec découpage horaire (par heure ou demi-heure) permettant de voir les chevauchements d'affectations et les détails des interventions programmées.

## 7. Fonctionnalités Supplémentaires

### 7.1 Indicateurs Visuels

- **Codes couleur** : Différencier types d'affectations et statuts (publié, brouillon)
- **Icônes** : Indiquer particularités (pédiatrie, senior, compétence spécifique)
- **Badges** : Signaler nombre de jours consécutifs travaillés, compteurs particuliers
- **Indicateurs d'équité** : Couleurs graduées pour indiquer l'équilibre des charges (vert = équilibré, rouge = déséquilibré)

### 7.2 Superposition d'Informations

- Option pour superposer la trame des chirurgiens au planning
- Option pour afficher les congés en transparence sur les jours non travaillés
- Option pour afficher des métriques directement sur le planning (nombre de salles couvertes, taux de remplissage...) 