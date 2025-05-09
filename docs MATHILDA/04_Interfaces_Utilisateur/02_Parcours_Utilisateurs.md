# Parcours Utilisateurs - MATHILDA

Ce document décrit les parcours utilisateurs clés au sein de l'application MATHILDA.

## 1. Parcours : Un employé soumet une demande de congé

*   **Acteur :** Employé
*   **Objectif :** Soumettre une demande de congé pour approbation.
*   **Étapes :**
    1.  L'employé se connecte à l'application.
    2.  L'employé navigue vers la section "Mes Demandes" ou "Soumettre une Absence".
    3.  L'employé clique sur "Nouvelle Demande".
    4.  L'employé remplit le formulaire de demande :
        *   Sélectionne le type d'absence (ex: Congé Payé).
        *   Choisit les dates de début et de fin.
        *   Vérifie le nombre de jours décomptés et son solde prévisionnel.
        *   Ajoute un commentaire (optionnel).
        *   Joint un justificatif si nécessaire (ex: pour un arrêt maladie).
    5.  L'employé soumet la demande.
    6.  L'employé reçoit une confirmation visuelle de la soumission.
    7.  (Optionnel) L'employé reçoit un email de confirmation.
    8.  L'employé peut consulter le statut de sa demande (En attente) dans son historique.

## 2. Parcours : Un manager approuve une demande de congé

*   **Acteur :** Manager
*   **Objectif :** Examiner et approuver (ou rejeter) une demande de congé soumise par un membre de son équipe.
*   **Étapes :**
    1.  Le manager se connecte à l'application.
    2.  (Optionnel) Le manager reçoit une notification (email ou in-app) concernant une nouvelle demande.
    3.  Le manager navigue vers la section "Approbations" ou "Demandes de l'Équipe".
    4.  Le manager voit la liste des demandes en attente.
    5.  Le manager sélectionne une demande pour en voir les détails :
        *   Nom de l'employé.
        *   Type d'absence, dates, durée.
        *   Commentaire de l'employé.
        *   (Optionnel) Solde de congés de l'employé.
        *   (Optionnel) Planning de l'équipe pour la période concernée pour vérifier les conflits.
    6.  Le manager prend une décision :
        *   **Approuver :** Clique sur "Approuver".
        *   **Rejeter :** Clique sur "Rejeter", saisit un motif (obligatoire ou optionnel selon configuration).
    7.  La demande est mise à jour (statut Approuvée/Rejetée).
    8.  L'employé est notifié de la décision.
    9.  (Optionnel) Le manager peut voir la demande mise à jour dans le planning des absences.

## 3. Parcours : Un administrateur ajoute un nouvel utilisateur

*   **Acteur :** Administrateur
*   **Objectif :** Créer un nouveau compte utilisateur dans le système.
*   **Étapes :**
    1.  L'administrateur se connecte à l'application.
    2.  L'administrateur navigue vers la section "Gestion des Utilisateurs".
    3.  L'administrateur clique sur "Ajouter Utilisateur".
    4.  L'administrateur remplit le formulaire de création d'utilisateur :
        *   Nom, Prénom
        *   Adresse email (servira d'identifiant)
        *   Mot de passe temporaire (ou option pour que l'utilisateur le définisse au premier login)
        *   Rôle (Admin, Manager, Employé)
        *   (Optionnel) Équipe(s) d'appartenance
    5.  L'administrateur soumet le formulaire.
    6.  Le nouvel utilisateur est créé et apparaît dans la liste des utilisateurs.
    7.  (Optionnel) Le nouvel utilisateur reçoit un email de bienvenue avec ses identifiants ou un lien pour activer son compte.

## 4. Parcours : Un employé consulte son planning

*   **Acteur :** Employé
*   **Objectif :** Visualiser son planning personnel (astreintes, interventions, congés).
*   **Étapes :**
    1.  L'employé se connecte à l'application.
    2.  L'employé navigue vers la section "Mon Planning" ou "Tableau de Bord" (si le planning y est affiché).
    3.  L'employé voit une vue calendrier (par défaut : semaine ou mois en cours).
    4.  Ses événements personnels (astreintes, interventions assignées, congés approuvés) sont affichés.
    5.  L'employé peut naviguer entre les différentes périodes (semaine/mois précédent/suivant).
    6.  (Optionnel) L'employé peut cliquer sur un événement pour voir plus de détails.

---

*Ces parcours serviront de base pour valider la fluidité de l'expérience utilisateur et identifier les écrans nécessaires.*

# Parcours Utilisateurs

Ce document décrit les principaux parcours utilisateurs dans l'application MATHILDA, illustrant comment les différents acteurs interagissent avec le système pour accomplir leurs tâches principales.

## 1. Parcours d'un MAR Standard

### 1.1 Consultation de son planning

1. **Connexion à l'application**
   - Le MAR se connecte avec ses identifiants
   - Le système affiche son tableau de bord personnel

2. **Accès au planning**
   - Le MAR clique sur "Mon Planning" dans le menu principal
   - Le système affiche son planning personnel pour la semaine en cours
   - Le MAR peut naviguer entre les jours/semaines/mois
   - Le MAR peut filtrer les affichages (gardes, bloc, consultations)

3. **Visualisation des détails d'une affectation**
   - Le MAR clique sur une affectation spécifique
   - Le système affiche les détails (horaires précis, salle, secteur, supervision)
   - Des informations complémentaires sont disponibles (IADE associé, chirurgien, etc.)

### 1.2 Demande de congés

1. **Accès au module de congés**
   - Depuis le menu "Mes Demandes", le MAR sélectionne "Nouvelle demande de congés"
   - Le système affiche le formulaire de demande

2. **Saisie de la demande**
   - Le MAR sélectionne les dates de début et fin
   - Le MAR indique le motif du congé
   - Le système affiche les congés déjà accordés pour cette période
   - Le MAR soumet sa demande

3. **Suivi de la demande**
   - Le système notifie le MAR que sa demande a été soumise
   - La demande apparaît dans "Mes demandes en cours"
   - Le MAR reçoit une notification lorsque sa demande est traitée

### 1.3 Demande d'échange d'affectation

1. **Identification de l'affectation à échanger**
   - Dans son planning, le MAR identifie une affectation qu'il souhaite échanger
   - Le MAR clique sur "Proposer un échange" depuis les détails de l'affectation

2. **Sélection des paramètres de l'échange**
   - Le système propose les collègues MAR disponibles pour un échange
   - Le MAR sélectionne un collègue cible
   - Le système affiche les affectations du collègue compatibles pour l'échange
   - Le MAR sélectionne l'affectation qu'il souhaite recevoir en échange

3. **Soumission et suivi**
   - Le MAR confirme sa demande d'échange
   - Le système notifie le collègue concerné
   - Le MAR peut suivre l'état de sa demande dans "Mes demandes en cours"

## 2. Parcours d'un Administrateur MAR

### 2.1 Génération d'un planning

1. **Accès au module de planification**
   - L'administrateur se connecte et accède à "Administration > Planification"
   - Le système affiche l'interface de génération de planning

2. **Configuration des paramètres**
   - L'administrateur sélectionne la période (semaine/mois)
   - L'administrateur définit les contraintes particulières pour cette période
   - L'administrateur peut exclure certains utilisateurs ou salles

3. **Génération et ajustement**
   - L'administrateur lance la génération automatique
   - Le système génère une proposition de planning conforme aux règles
   - L'administrateur examine le planning proposé
   - L'administrateur apporte des ajustements manuels si nécessaire
   - L'administrateur valide le planning définitif

4. **Publication et notification**
   - L'administrateur publie le planning
   - Le système notifie tous les utilisateurs concernés
   - Le planning devient visible pour tous les utilisateurs selon leurs droits

### 2.2 Traitement des demandes de congés

1. **Consultation des demandes en attente**
   - L'administrateur accède à "Administration > Demandes en attente"
   - Le système affiche la liste des demandes non traitées, triées par date

2. **Analyse d'une demande**
   - L'administrateur sélectionne une demande
   - Le système affiche les détails de la demande
   - Le système indique le nombre de personnes déjà en congé pour cette période
   - L'administrateur voit l'impact sur le planning si la demande est acceptée

3. **Décision et notification**
   - L'administrateur accepte ou refuse la demande
   - En cas de refus, l'administrateur indique le motif
   - Le système notifie l'utilisateur de la décision
   - Le planning est automatiquement mis à jour en cas d'acceptation

### 2.3 Configuration des règles d'affectation

1. **Accès aux règles de configuration**
   - L'administrateur accède à "Administration > Configuration > Règles d'affectation"
   - Le système affiche les règles actuelles par secteur

2. **Modification des paramètres**
   - L'administrateur sélectionne un secteur à configurer
   - L'administrateur modifie les paramètres (nombre de salles par IADE, règles de supervision, etc.)
   - Le système vérifie la cohérence des règles

3. **Test et validation**
   - L'administrateur peut tester l'impact des nouvelles règles sur un planning test
   - L'administrateur confirme les modifications
   - Le système applique les nouvelles règles pour les futures générations de planning

## 3. Parcours d'un IADE

### 3.1 Consultation de son planning

1. **Connexion et accès au planning**
   - L'IADE se connecte à l'application
   - L'IADE accède directement à son planning hebdomadaire depuis le tableau de bord

2. **Visualisation des affectations**
   - L'IADE voit ses affectations par jour et par créneau
   - Pour chaque affectation, l'IADE visualise :
     - Le secteur et la salle
     - Le MAR superviseur
     - Les horaires précis

### 3.2 Demande d'échange d'affectation

1. **Initiation de la demande**
   - L'IADE sélectionne une affectation dans son planning
   - L'IADE choisit "Proposer un échange"
   - Le système filtre automatiquement les IADEs disponibles pour cet échange

2. **Sélection et confirmation**
   - L'IADE sélectionne un collègue et l'affectation souhaitée
   - L'IADE confirme sa demande
   - Le système envoie la demande au collègue concerné

3. **Réception d'une demande d'échange**
   - L'IADE reçoit une notification de demande d'échange
   - L'IADE consulte les détails de la proposition
   - L'IADE accepte ou refuse la demande
   - Le système met à jour les plannings en conséquence

## 4. Parcours d'un Chirurgien

### 4.1 Consultation du planning

1. **Accès limité au planning**
   - Le chirurgien se connecte à l'application
   - Le chirurgien accède à la vue "Planning du bloc"
   - Le système affiche uniquement les informations pertinentes pour le chirurgien

2. **Visualisation de ses interventions**
   - Le chirurgien peut filtrer pour ne voir que ses interventions
   - Pour chaque intervention, le chirurgien voit :
     - La salle et le secteur
     - Les horaires
     - L'équipe d'anesthésie affectée (MAR/IADE)

### 4.2 Déclaration d'absence

1. **Saisie d'une nouvelle absence**
   - Le chirurgien accède à "Mes absences" depuis son profil
   - Le chirurgien sélectionne la période d'absence
   - Le chirurgien indique le motif

2. **Soumission et impact**
   - Le chirurgien soumet son absence
   - Le système notifie les administrateurs
   - L'absence est prise en compte dans la génération des futurs plannings

## 5. Parcours d'une Secrétaire Médicale

### 5.1 Consultation des plannings

1. **Accès en lecture aux plannings**
   - La secrétaire se connecte à l'application
   - La secrétaire accède à la vue globale des plannings
   - La secrétaire peut filtrer par secteur, date, personnel

2. **Utilisation des informations**
   - La secrétaire peut exporter les plannings (PDF, Excel)
   - La secrétaire peut imprimer des versions adaptées
   - La secrétaire ne peut pas modifier les plannings

### 5.2 Saisie administrative

1. **Accès aux fonctions administratives**
   - La secrétaire accède à "Administration > Saisie administrative"
   - La secrétaire peut saisir certaines informations non sensibles

2. **Exportation de rapports**
   - La secrétaire peut générer des rapports d'activité
   - La secrétaire peut exporter des statistiques selon ses droits

## Notes sur les Parcours

- Les parcours décrits représentent les flux typiques et peuvent varier selon les configurations spécifiques.
- Les interfaces utilisateur seront conçues pour refléter ces parcours de façon intuitive et efficace.
- Les notifications mentionnées peuvent être configurées pour apparaître dans l'application et/ou être envoyées par email.
- Chaque parcours sera accompagné de guides utilisateurs détaillés dans la version finale de l'application. 