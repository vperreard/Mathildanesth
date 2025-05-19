# Guide de l'Administrateur Mathildanesth

Ce guide est destiné aux utilisateurs ayant un rôle d'Administrateur dans Mathildanesth. Il décrit les principales fonctionnalités et responsabilités liées à ce rôle.

## 1. Introduction au Rôle d'Administrateur

En tant qu'administrateur, vous avez accès à des fonctionnalités étendues pour configurer l'application, gérer les utilisateurs, superviser les processus et assurer le bon fonctionnement global de Mathildanesth pour votre établissement ou service.

Vos responsabilités typiques incluent :
- La gestion des comptes utilisateurs et de leurs droits.
- La configuration des règles de planification et des contraintes métier.
- La personnalisation des types d'activités, des types de congés, etc.
- La supervision de la génération des plannings.
- La maintenance des données de référence (sites, secteurs, salles).
- Le suivi de l'activité via les journaux d'audit.

## 2. Gestion des Utilisateurs

Une tâche centrale de l'administrateur est la gestion des comptes utilisateurs.

### 2.1. Créer un Nouvel Utilisateur
1.  Accédez à la section **"Administration"** ou **"Paramètres"**, puis **"Gestion des Utilisateurs"**.
2.  Cliquez sur **"Créer un utilisateur"** ou un bouton similaire.
3.  Remplissez les informations requises :
    -   Nom, Prénom
    -   Identifiant de connexion (login)
    -   Adresse e-mail
    -   Mot de passe initial (l'utilisateur pourra souvent le modifier ensuite)
    -   **Rôle Applicatif** : `USER`, `PLANNER`, `ADMIN` (choisissez avec soin).
    -   **Rôle Professionnel** : MAR, IADE, Chirurgien, Secrétaire, etc.
    -   Informations sur le temps de travail (temps plein, temps partiel avec pourcentage).
    -   Site(s) de rattachement.
4.  Validez la création.

### 2.2. Modifier un Utilisateur Existant
-   Dans la liste des utilisateurs, sélectionnez l'utilisateur à modifier.
-   Vous pourrez mettre à jour ses informations, son rôle, ses affectations de site, etc.
-   Il est également possible de réinitialiser un mot de passe ou de désactiver un compte.

### 2.3. Gestion des Compétences et Spécialités
-   Pour les utilisateurs concernés (notamment les chirurgiens pour les spécialités, et tous pour les compétences), vous pouvez assigner :
    -   Des **Spécialités** (ex: Orthopédie, Cardiologie) via le profil du chirurgien.
    -   Des **Compétences** (ex: ALR membre supérieur, Anesthésie pédiatrique) via la table de liaison `UserSkill`.
-   Ces informations sont cruciales pour l'adéquation des affectations. (Voir [Documentation Fonctionnelle - Gestion des Compétences](../02_Fonctionnalites/13_Gestion_Competences/01_Definition_Assignation.md))

## 3. Configuration du Système

Mathildanesth offre de nombreuses options de configuration pour s'adapter aux besoins de votre établissement.

### 3.1. Gestion des Règles de Planification
-   Accédez à la section **"Administration" > "Règles de Planification"** (ou nom similaire).
-   Vous pourrez :
    -   Consulter les règles existantes.
    -   Modifier les paramètres des règles (ex: seuils, priorités).
    -   Activer ou désactiver des règles.
    -   Potentiellement créer de nouvelles règles si l'interface le permet.
-   Il est crucial de bien comprendre l'impact de chaque règle. Testez les modifications sur des périodes limitées ou des scénarios de simulation si possible. (Voir [Documentation Fonctionnelle - Moteur de Règles](../02_Fonctionnalites/03_Planning_Generation/01_Moteur_Regles.md))

### 3.2. Configuration des Structures Organisationnelles
-   **Sites** : Définir et gérer les différents sites hospitaliers.
-   **Départements/Services** : Organiser les sites en départements ou services.
-   **Lieux (`Location`)** : Définir des lieux spécifiques (bureaux, salles de réunion) pour les affectations hors bloc.
-   (Voir [Documentation Fonctionnelle - Structure Géographique](../02_Fonctionnalites/07_Gestion_Affectations/02_Structure_Geographique.md))

### 3.3. Configuration du Bloc Opératoire
-   **Secteurs Opératoires (`OperatingSector`)** : Définir les secteurs du bloc (ex: Bloc Orthopédie, Ambulatoire), leur catégorie.
-   **Salles d'Opération (`OperatingRoom`)** : Configurer les salles, leur type, leur secteur de rattachement, et leurs équipements/caractéristiques.
-   (Voir [Documentation Fonctionnelle - Configuration Salles et Équipements](../02_Fonctionnalites/04_Bloc_Operatoire/01_Configuration_Salles_Equipements.md))

### 3.4. Gestion des Types d'Activités et d'Affectations (`ActivityType`)
-   Définissez les différents types d'activités que le personnel peut se voir assigner (ex: Garde sur place, Astreinte, Consultation, Formation, Réunion, Tâche administrative).
-   Pour chaque type, configurez :
    -   Code, libellé, couleur d'affichage.
    -   Catégorie d'activité.
    -   Règles spécifiques associées (ex: impact sur les compteurs).
-   (Voir [Documentation Fonctionnelle - Types d'Affectations](../02_Fonctionnalites/07_Gestion_Affectations/01_Types_Affectations.md))

### 3.5. Gestion des Types de Congés (`LeaveType`)
-   Configurez les différents types de congés (Annuel, RTT, Maladie, Formation, Sans Solde, etc.).
-   Pour chaque type, définissez :
    -   Les règles d'attribution (ex: quota annuel par défaut).
    -   L'impact sur les compteurs.
    -   Les conditions de demande (ex: délai de prévenance).
-   (Voir [Documentation Fonctionnelle - Quotas et Soldes](../02_Fonctionnalites/02_Gestion_Conges_Absences/04_Quota_Management_Soldes.md))

### 3.6. Gestion des Trames de Planning (`TrameModele`)
-   Les trames modèles permettent de définir des structures de planning récurrentes.
-   En tant qu'administrateur, vous pouvez :
    -   Créer de nouvelles trames (hebdomadaires, par type de semaine).
    -   Définir les affectations types au sein d'une trame (jour, période, activité, personnel requis).
    -   Modifier, dupliquer ou archiver des trames existantes.
-   Une bonne gestion des trames facilite grandement la génération des plannings.
-   (Voir [Documentation Technique - Trames de Planning](../../modules/templates/components/BlocPlanningTemplateEditor.md) et potentiellement des guides spécifiques dans les fonctionnalités)

### 3.7. Jours Fériés (`PublicHoliday`)
-   Maintenez à jour la liste des jours fériés pour qu'ils soient correctement pris en compte dans la planification et le calcul des droits.

## 4. Supervision et Maintenance

### 4.1. Suivi des Journaux d'Audit (`AuditLog`)
-   Consultez régulièrement les journaux d'audit pour suivre les actions importantes effectuées dans le système, identifier des anomalies ou investiguer des incidents.
-   Des filtres vous permettent de cibler vos recherches (par utilisateur, action, entité, période).
-   (Voir [Documentation Fonctionnelle - Journal d'Activité et Historique](../02_Fonctionnalites/16_Historisation_Audit/01_Journal_Activite_Historique.md))

### 4.2. Imports et Exports de Données
-   Utilisez les fonctionnalités d'import pour initialiser ou mettre à jour des données en masse (ex: utilisateurs, trames). Soyez prudent et utilisez des fichiers correctement formatés.
-   Utilisez les fonctionnalités d'export pour des besoins d'analyse externe, de reporting ou d'archivage.
-   (Voir [Documentation Fonctionnelle - Imports, Exports et Impressions](../02_Fonctionnalites/17_Imports_Exports/01_Imports_Exports_et_Impressions.md))

## 5. Bonnes Pratiques pour Administrateurs

-   **Communication** : Informez les utilisateurs des changements majeurs de configuration ou des maintenances planifiées.
-   **Prudence** : Avant de modifier des configurations critiques (surtout les règles de planning), évaluez l'impact potentiel. Si possible, testez dans un environnement de pré-production ou sur une petite échelle.
-   **Documentation Interne** : Maintenez une documentation interne (en dehors de Mathildanesth si besoin) des choix de configuration spécifiques à votre établissement.
-   **Formation Continue** : Tenez-vous informé des nouvelles fonctionnalités et des bonnes pratiques d'administration de Mathildanesth.

---

Ce guide couvre les aspects principaux de l'administration de Mathildanesth. Pour des détails plus approfondis sur chaque fonctionnalité, référez-vous aux sections spécifiques de la documentation fonctionnelle et technique. 