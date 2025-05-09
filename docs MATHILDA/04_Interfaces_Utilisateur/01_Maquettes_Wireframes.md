# Maquettes et Wireframes

Ce document présente les maquettes conceptuelles des principales interfaces utilisateur de l'application MATHILDA. Ces représentations serviront de guide pour le développement des interfaces finales.

## 1. Structure Générale de l'Interface

L'interface de MATHILDA suivra une structure cohérente pour tous les types d'utilisateurs, avec des adaptations selon les droits d'accès.

```
+-----------------------------------------------------------------------+
|                                                                       |
|  Logo MATHILDA    Menu principal    Recherche    Notifications  Profil|
|                                                                       |
+-----------------------------------------------------------------------+
|                  |                                                    |
|                  |                                                    |
|  Menu            |                                                    |
|  contextuel      |             Zone de contenu principal              |
|                  |                                                    |
|  - Option 1      |                                                    |
|  - Option 2      |                                                    |
|  - Option 3      |                                                    |
|  - etc.          |                                                    |
|                  |                                                    |
+------------------+----------------------------------------------------+
```

## 2. Tableau de Bord Personnel

Le tableau de bord sera la page d'accueil après connexion, offrant une vue synthétique adaptée au profil de l'utilisateur.

```
+-----------------------------------------------------------------------+
|                        TABLEAU DE BORD                                |
+-----------------------------------------------------------------------+
|                        |                                              |
| PLANNING DU JOUR       | NOTIFICATIONS ET ALERTES                     |
|                        |                                              |
| [Vue calendrier        | - Nouvelle demande d'échange (il y a 1h)     |
|  condensée avec        | - Planning de la semaine publié (hier)       |
|  affectations]         | - Congé approuvé pour le 15/07 (hier)        |
|                        |                                              |
+------------------------+----------------------------------------------+
|                        |                                              |
| MES COMPTEURS          | MES DEMANDES EN COURS                        |
|                        |                                              |
| Heures: +12h           | - Congé du 20/08 au 27/08 (en attente)       |
| Gardes: 3/5 (mois)     | - Échange garde du 12/07 (en attente)        |
| Consult.: 8/10 (mois)  |                                              |
|                        |                                              |
+------------------------+----------------------------------------------+
|                                                                       |
| ACCÈS RAPIDES                                                         |
|                                                                       |
| [Nouvelle demande] [Voir planning] [Déclarer heures] [Échange]        |
|                                                                       |
+-----------------------------------------------------------------------+
```

## 3. Vue Planning

La vue planning sera l'interface centrale de l'application, permettant de visualiser et gérer les affectations.

### 3.1 Vue Hebdomadaire (par défaut)

```
+-----------------------------------------------------------------------+
|  < Semaine précédente    PLANNING: 10-16 JUILLET 2023    Semaine >    |
|                                                                       |
|  [Vue Jour] [Vue Semaine] [Vue Mois]    [Filtres ▼]    [Exporter ▼]   |
+-----------------------------------------------------------------------+
|           | LUNDI     | MARDI     | MERCREDI  | JEUDI     | VENDREDI  |
|-----------+-----------+-----------+-----------+-----------+-----------|
|  MATIN    | Secteur   | Secteur   | Congé     | Secteur   | Secteur   |
|  8h-13h   | Septique  | Ophtalmo  |           | Septique  | Hyperasep.|
|           | Salle 10  | Salle 15  |           | Salle 11  | Salle 3   |
|           | Anesthésie| Supervision|          | Supervision| Anesthésie|
|-----------+-----------+-----------+-----------+-----------+-----------|
|  APRÈS-   | Secteur   | Secteur   | Congé     | Secteur   | Secteur   |
|  MIDI     | Septique  | Consult.  |           | Septique  | Hyperasep.|
|  13h30-   | Salle 10  |           |           | Salle 11  | Salle 3   |
|  18h30    | Anesthésie|           |           | Supervision| Anesthésie|
|-----------+-----------+-----------+-----------+-----------+-----------|
|  GARDE/   |           |           |           |           |           |
|  ASTREINTE|           | Astreinte |           |           |           |
|  24h      |           |           |           |           |           |
+-----------------------------------------------------------------------+
|                                                                       |
|  Légende: [Anesthésie] [Supervision] [Consultation] [Congé] [Garde]   |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 3.2 Vue Détaillée d'une Affectation

```
+-----------------------------------------------------------------------+
|                    DÉTAILS DE L'AFFECTATION                           |
+-----------------------------------------------------------------------+
|                                                                       |
|  Date: Mardi 11/07/2023             Créneau: Matin (8h-13h)           |
|                                                                       |
|  Secteur: Ophtalmo                  Salle: 15                         |
|                                                                       |
|  Type d'affectation: Supervision                                      |
|                                                                       |
|  Personnel supervisé: Martin Thomas (IADE)                            |
|                                                                       |
|  Chirurgien: Dr. Dupont                                               |
|                                                                       |
|  Notes: Prévoir temps supplémentaire pour formation nouvel équipement |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|     [Proposer échange]    [Modifier notes]    [Fermer]                |
|                                                                       |
+-----------------------------------------------------------------------+
```

## 4. Interface de Demande de Congés

```
+-----------------------------------------------------------------------+
|                        NOUVELLE DEMANDE DE CONGÉ                      |
+-----------------------------------------------------------------------+
|                                                                       |
|  Période de congé                                                     |
|  Du: [Calendrier - 20/08/2023]    Au: [Calendrier - 27/08/2023]       |
|                                                                       |
|  Type de congé:                                                       |
|  [▼ Congés annuels]                                                   |
|                                                                       |
|  Motif/Commentaire:                                                   |
|  +---------------------------------------------------------------+    |
|  | Congés d'été                                                  |    |
|  +---------------------------------------------------------------+    |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  Informations complémentaires:                                        |
|  - Nombre de jours demandés: 6 jours ouvrés                           |
|  - Solde de congés disponible: 15 jours                               |
|  - Personnel déjà en congé sur cette période: 1 MAR, 2 IADEs          |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|      [Annuler]                                [Soumettre]             |
|                                                                       |
+-----------------------------------------------------------------------+
```

## 5. Interface d'Administration

### 5.1 Génération de Planning

```
+-----------------------------------------------------------------------+
|                        GÉNÉRATION DE PLANNING                         |
+-----------------------------------------------------------------------+
|                                                                       |
|  Période:                                                             |
|  Du: [Calendrier - 01/09/2023]    Au: [Calendrier - 30/09/2023]       |
|                                                                       |
|  Options:                                                             |
|  [x] Intégrer les congés validés                                      |
|  [x] Respecter les gardes déjà planifiées                             |
|  [x] Prioriser l'équilibrage des compteurs                            |
|  [ ] Inclure les requêtes spécifiques non validées                    |
|                                                                       |
|  Personnel à exclure: [Sélection multiple ▼]                          |
|                                                                       |
|  Salles/Secteurs à exclure: [Sélection multiple ▼]                    |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|      [Annuler]    [Générer aperçu]    [Générer et publier]           |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 5.2 Gestion des Demandes

```
+-----------------------------------------------------------------------+
|                        DEMANDES EN ATTENTE                            |
+-----------------------------------------------------------------------+
|                                                                       |
|  Filtrer par: [▼ Tous les types]    Trier par: [▼ Date (récent)]      |
|                                                                       |
+-----------------------------------------------------------------------+
|  Type      | Demandeur     | Date           | Détails                 |
|-----------+--------------+---------------+---------------------------|
|  Congé     | Dr. Martin    | 15/07-20/07/23 | Congés annuels          |
|  Échange   | Dr. Petit     | 12/07/23       | Garde avec Dr. Legrand  |
|  Requête   | M. Thomas     | 18/07/23       | Secteur ophtalmo        |
|  Congé     | Mme. Robert   | 25/08-30/08/23 | Formation               |
|  ...       | ...           | ...            | ...                     |
+-----------------------------------------------------------------------+
|                                                                       |
|  Demande sélectionnée:                                                |
|  Congé du Dr. Martin (15/07 - 20/07/2023)                            |
|                                                                       |
|  Détails: Congés annuels planifiés en famille                         |
|  Impact: 1 autre MAR en congé sur cette période (Dr. Dubois)          |
|  Remplacement nécessaire: Garde du 18/07/2023                         |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  Commentaire:                                                         |
|  +---------------------------------------------------------------+    |
|  | Accordé pour cette période mais prévoir remplacement garde    |    |
|  +---------------------------------------------------------------+    |
|                                                                       |
|      [Refuser]    [Approuver avec conditions]    [Approuver]          |
|                                                                       |
+-----------------------------------------------------------------------+
```

## 6. Interface de Configuration des Règles

```
+-----------------------------------------------------------------------+
|                 CONFIGURATION DES RÈGLES D'AFFECTATION                |
+-----------------------------------------------------------------------+
|                                                                       |
|  Secteur: [▼ Ophtalmo]                                                |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  Règles de couverture:                                                |
|  +---------------------------------------------------------------+    |
|  | Nombre maximum de salles par IADE: [3]                        |    |
|  | Nombre maximum de salles par MAR: [3]                         |    |
|  | Nombre maximum de supervision par MAR: [2]                    |    |
|  +---------------------------------------------------------------+    |
|                                                                       |
|  Règles de continuité:                                                |
|  +---------------------------------------------------------------+    |
|  | [x] Autoriser différentes affectations matin/après-midi       |    |
|  | [ ] Maintenir même salle entre matin et après-midi            |    |
|  | [ ] Maintenir même IADE/MAR pour une salle toute la journée   |    |
|  +---------------------------------------------------------------+    |
|                                                                       |
|  Règles spécifiques:                                                  |
|  +---------------------------------------------------------------+    |
|  | Si 4 salles actives:                                          |    |
|  | [x] Diviser en 2+2 entre MAR et IADE                          |    |
|  +---------------------------------------------------------------+    |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|      [Annuler]    [Tester impact]    [Enregistrer]                    |
|                                                                       |
+-----------------------------------------------------------------------+
```

## 7. Interface Mobile

Les interfaces mobiles reprendront les mêmes fonctionnalités mais avec une disposition adaptée aux petits écrans.

```
+-----------------------------+      +-----------------------------+
|                             |      |                             |
|  MATHILDA     Menu ☰  👤   |      |  < RETOUR         MAR 11/07 |
|                             |      |                             |
|  PLANNING: CETTE SEMAINE    |      |  DÉTAILS AFFECTATION        |
|                             |      |                             |
|  < L  M  M  J  V  S  D >    |      |  Matin (8h-13h)             |
|    10 11 12 13 14 15 16     |      |  Ophtalmo - Salle 15        |
|                             |      |  Type: Supervision          |
|  11 JUILLET                 |      |                             |
|                             |      |  Personnel:                 |
|  MATIN                      |      |  - Martin T. (IADE)         |
|  Ophtalmo - Salle 15        |      |                             |
|  Supervision                |      |  Chirurgien:                |
|                             |      |  - Dr. Dupont               |
|  APRÈS-MIDI                 |      |                             |
|  Consultation               |      |  Notes:                     |
|                             |      |  Prévoir temps formation    |
|  GARDE/ASTREINTE            |      |                             |
|  Astreinte (24h)            |      |  [Proposer échange]         |
|                             |      |                             |
+-----------------------------+      +-----------------------------+
```

## Notes sur les Maquettes

- Ces maquettes sont conceptuelles et représentent la structure générale.
- L'interface finale bénéficiera d'une charte graphique complète avec couleurs, icônes et typographie cohérentes.
- Des ajustements seront apportés en fonction des retours utilisateurs lors des phases de test.
- Les interfaces seront développées en responsive design pour s'adapter à tous les types d'écrans.
- L'accessibilité sera prise en compte pour garantir l'utilisabilité pour tous.

*Note : Dans une phase ultérieure, ces maquettes seront transformées en prototypes interactifs pour validation avant développement.*

# Maquettes Wireframes - MATHILDA

Ce document décrit les wireframes des écrans principaux de l'application MATHILDA.

## 1. Écran de Planning Principal

*   **Objectif :** Visualiser le planning des employés, créer et modifier des événements.
*   **Éléments Clés :**
    *   Vue Calendrier (jour/semaine/mois)
    *   Liste des employés/équipes filtrable
    *   Boutons d'action : "Créer Événement", "Importer", "Exporter"
    *   Panneau de détails de l'événement (lorsqu'un événement est sélectionné)
    *   Filtres (par statut, par type d'événement, etc.)
    *   Navigation (période précédente/suivante)
*   **Actions Possibles :**
    *   Créer un nouvel événement (astreinte, intervention, absence planifiée)
    *   Modifier un événement existant
    *   Supprimer un événement
    *   Glisser-déposer des événements
    *   Assigner/réassigner des événements à des employés
    *   Changer la vue du calendrier
    *   Filtrer le planning

## 2. Gestion des Utilisateurs (Admin)

*   **Objectif :** Administrer les comptes utilisateurs (création, modification, suppression, rôles).
*   **Éléments Clés :**
    *   Liste des utilisateurs (avec nom, email, rôle, statut)
    *   Fonction de recherche et de filtrage
    *   Boutons d'action : "Ajouter Utilisateur", "Modifier", "Supprimer", "Réinitialiser Mot de Passe"
    *   Formulaire de création/modification d'utilisateur :
        *   Nom, Prénom
        *   Email
        *   Mot de passe (pour la création)
        *   Rôle (Admin, Manager, Employé)
        *   Équipe(s) d'appartenance
        *   Statut (Actif/Inactif)
*   **Actions Possibles :**
    *   Ajouter un nouvel utilisateur
    *   Modifier les informations d'un utilisateur existant
    *   Changer le rôle d'un utilisateur
    *   Activer/Désactiver un compte utilisateur
    *   Supprimer un utilisateur

## 3. Soumission et Gestion des Congés/Absences

*   **Objectif (Employé) :** Soumettre une demande de congé/absence, visualiser le statut de ses demandes et son solde de congés.
*   **Objectif (Manager/Admin) :** Approuver/rejeter les demandes de congés, visualiser le planning des absences de l'équipe.
*   **Éléments Clés (Vue Employé) :**
    *   Solde de congés (payés, RTT, etc.)
    *   Calendrier personnel avec absences marquées
    *   Formulaire de demande de congé :
        *   Type d'absence (Congé payé, RTT, Maladie, Sans solde, etc.)
        *   Dates de début et de fin
        *   Commentaire (optionnel)
        *   Pièce jointe (ex: arrêt maladie)
    *   Liste des demandes (avec statut : En attente, Approuvée, Rejetée)
    *   Bouton : "Nouvelle Demande"
*   **Éléments Clés (Vue Manager/Admin) :**
    *   Liste des demandes d'absence en attente de son équipe/de tous les employés
    *   Détail de la demande (avec informations de l'employé, type, dates, solde avant demande)
    *   Boutons : "Approuver", "Rejeter" (avec possibilité d'ajouter un motif)
    *   Vue Calendrier des absences de l'équipe/de l'entreprise
    *   Filtres (par équipe, par statut, par type d'absence)
*   **Actions Possibles (Employé) :**
    *   Soumettre une nouvelle demande d'absence
    *   Annuler une demande en attente
    *   Consulter l'historique de ses demandes
*   **Actions Possibles (Manager/Admin) :**
    *   Approuver une demande d'absence
    *   Rejeter une demande d'absence
    *   Consulter le planning des absences
    *   Modifier/annuler une absence approuvée (avec justification)

## 4. Écran de Configuration (Admin)

*   **Objectif :** Paramétrer les aspects généraux de l'application.
*   **Éléments Clés :**
    *   Sections de configuration (ex: "Paramètres Généraux", "Gestion des Types d'Absence", "Notifications", "Intégrations")
    *   **Paramètres Généraux :**
        *   Nom de l'entreprise
        *   Fuseau horaire par défaut
        *   Formats de date/heure
    *   **Gestion des Types d'Absence :**
        *   Liste des types d'absence (Congé Payé, RTT, Maladie, etc.)
        *   Ajouter/Modifier/Supprimer un type d'absence
        *   Définir si un type d'absence nécessite une pièce jointe
        *   Définir si un type d'absence est décompté du solde
    *   **Notifications :**
        *   Configuration des emails de notification (demande soumise, approuvée, rejetée, etc.)
    *   **Gestion des Équipes/Départements (si applicable)**
*   **Actions Possibles :**
    *   Modifier les paramètres généraux
    *   Gérer les types d'absences disponibles dans l'application
    *   Configurer les modèles de notification

## 5. Écran de Connexion (Login)

*   **Objectif :** Permettre à l'utilisateur de se connecter à l'application.
*   **Éléments Clés :**
    *   Champ Email/Nom d'utilisateur
    *   Champ Mot de passe
    *   Bouton "Se Connecter"
    *   Lien "Mot de passe oublié ?"
    *   (Optionnel) Connexion via SSO (Google, Microsoft, etc.)
*   **Actions Possibles :**
    *   Saisir ses identifiants
    *   Soumettre le formulaire de connexion
    *   Initier la procédure de récupération de mot de passe

## 6. Écran d'Inscription (Optionnel, si l'auto-inscription est permise)

*   **Objectif :** Permettre à un nouvel utilisateur de créer un compte.
*   **Éléments Clés :**
    *   Champ Nom
    *   Champ Prénom
    *   Champ Email
    *   Champ Mot de passe
    *   Champ Confirmation de mot de passe
    *   Bouton "S'inscrire"
*   **Actions Possibles :**
    *   Remplir le formulaire d'inscription
    *   Soumettre le formulaire

---

*Cette structure servira de base pour la création des wireframes détaillés.* 