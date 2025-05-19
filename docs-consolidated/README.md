# Documentation Consolidée Mathildanesth

Cette documentation a pour objectif de centraliser et d'organiser l'ensemble des informations techniques et fonctionnelles relatives à l'application Mathildanesth. Elle s'appuie sur les travaux antérieurs des projets Mathildanesth et MATHILDA, en les fusionnant et en les actualisant.

## Structure de la Documentation

La documentation est organisée comme suit :

### 0. Introduction
- [`00_Introduction.md`](./00_Introduction.md) : Présentation générale du projet, objectifs, contexte et périmètre.

### 1. Architecture Générale
*(Note : Cette section est en cours de révision pour éviter la redondance avec la section 03. Le contenu actuel est listé ci-dessous mais certains fichiers pourraient être fusionnés ou déplacés).*
- [`01_Architecture_Generale/01_Structure_Projet.md`](./01_Architecture_Generale/01_Structure_Projet.md) : Organisation des dossiers et fichiers du code source.
- [`01_Architecture_Generale/02_Architecture_Technique.md`](./01_Architecture_Generale/02_Architecture_Technique.md) : Description de la stack technique, des choix technologiques et des principaux composants.
- [`01_Architecture_Generale/03_Flux_Donnees.md`](./01_Architecture_Generale/03_Flux_Donnees.md) : Description des principaux flux de données. *(Contenu à vérifier et potentiellement fusionner)*
- [`01_Architecture_Generale/03_Modeles_Donnees.md`](./01_Architecture_Generale/03_Modeles_Donnees.md) : Présentation des modèles de données Prisma. *(Fichier à créer/compléter)*
- *(Autres fichiers dans 01_Architecture_Generale : 04_Gestion_Erreurs_Logging, 05_Securite_Permissions, 06_Conventions_Codage, 07_Processus_Developpement_CI_CD, 08_Internationalisation_i18n, 09_Accessibilite, 10_Performance - Ces sujets sont maintenant principalement couverts dans la section 03)*

### 2. Fonctionnalités Détaillées
- **`02_Fonctionnalites/00_Visualisation_Plannings_Navigation.md`** : Navigation générale et visualisation des plannings.
- **`02_Fonctionnalites/01_Utilisateurs_Profils/`**
  - [`01_Modele_Utilisateur.md`](./02_Fonctionnalites/01_Utilisateurs_Profils/01_Modele_Utilisateur.md) : Modèle utilisateur, rôles, permissions, authentification.
- **`02_Fonctionnalites/02_Gestion_Conges_Absences/`**
  - [`01_Processus_Gestion_Conges_Absences.md`](./02_Fonctionnalites/02_Gestion_Conges_Absences/01_Processus_Gestion_Conges_Absences.md) : Workflow global.
  - [`02_Demandes_Conges.md`](./02_Fonctionnalites/02_Gestion_Conges_Absences/02_Demandes_Conges.md) : Processus de demande.
  - [`02_Validation_Dates_Technique.md`](./02_Fonctionnalites/02_Gestion_Conges_Absences/02_Validation_Dates_Technique.md) : Aspects techniques de la validation.
  - [`03_Gestion_Absences_Imprevues.md`](./02_Fonctionnalites/02_Gestion_Conges_Absences/03_Gestion_Absences_Imprevues.md) : Saisie et impact.
  - [`04_Quota_Management_Soldes.md`](./02_Fonctionnalites/02_Gestion_Conges_Absences/04_Quota_Management_Soldes.md) : Gestion des quotas et soldes.
  - [`05_Detection_Conflits_Conges.md`](./02_Fonctionnalites/02_Gestion_Conges_Absences/05_Detection_Conflits_Conges.md) : Détection des conflits.
  - [`06_Conges_Absences_Recurrents.md`](./02_Fonctionnalites/02_Gestion_Conges_Absences/06_Conges_Absences_Recurrents.md) : Gestion des occurrences récurrentes.
- **`02_Fonctionnalites/03_Planning_Generation/`**
  - [`01_Moteur_Regles.md`](./02_Fonctionnalites/03_Planning_Generation/01_Moteur_Regles.md) : Concept et configuration du moteur de règles.
  - [`02_Interface_Generation.md`](./02_Fonctionnalites/03_Planning_Generation/02_Interface_Generation.md) : Interface utilisateur pour la génération.
  - [`03_Validation_Manuelle_Ajustements.md`](./02_Fonctionnalites/03_Planning_Generation/03_Validation_Manuelle_Ajustements.md) : Processus de validation et d'ajustements.
  - [`04_Publication_Notifications.md`](./02_Fonctionnalites/03_Planning_Generation/04_Publication_Notifications.md) : Publication et notifications associées.
  - [`05_Gestion_Historique_Plannings.md`](./02_Fonctionnalites/03_Planning_Generation/05_Gestion_Historique_Plannings.md) : Historisation des versions.
  - [`06_Optimisation_Algorithmes.md`](./02_Fonctionnalites/03_Planning_Generation/06_Optimisation_Algorithmes.md) : Pistes d'optimisation.
  *(Autres fichiers existants dans ce dossier: 00_Types_Affectations_Regles_Metier.md, 02_Algorithme_Generation.md, 03_Equilibrage_Optimisation.md, 04_Gestion_Conflits.md, 05_Equite_Qualite_Vie.md, 06_Selection_Propositions_Planning.md - Leur contenu est à réévaluer par rapport aux fichiers listés ci-dessus).*
- **`02_Fonctionnalites/04_Bloc_Operatoire/`**
  - [`01_Configuration_Salles_Equipements.md`](./02_Fonctionnalites/04_Bloc_Operatoire/01_Configuration_Salles_Equipements.md) : Configuration des salles, secteurs, équipements.
  - [`02_Planification_Interventions.md`](./02_Fonctionnalites/04_Bloc_Operatoire/02_Planification_Interventions.md) : Planification des interventions (vision Mathilde).
  - [`03_Gestion_Equipes_Bloc.md`](./02_Fonctionnalites/04_Bloc_Operatoire/03_Gestion_Equipes_Bloc.md) : Affectation des équipes MAR/IADE.
  - [`04_Suivi_Temps_Reel.md`](./02_Fonctionnalites/04_Bloc_Operatoire/04_Suivi_Temps_Reel.md) : Suivi en temps réel (vision avancée).
  - [`05_Statistiques_Utilisation_Bloc.md`](./02_Fonctionnalites/04_Bloc_Operatoire/05_Statistiques_Utilisation_Bloc.md) : Indicateurs et statistiques.
  *(Autres fichiers: 01_Configuration_Salles_Secteurs.md, 02_Regles_Supervision.md, 03_Planning_Hebdomadaire.md - Contenu à réévaluer).*
- **`02_Fonctionnalites/05_Interface_Collaboration/`**
  - [`01_Messagerie_Interne.md`](./02_Fonctionnalites/05_Interface_Collaboration/01_Messagerie_Interne.md) : Messagerie simple.
  - [`01_Messagerie_Contextuelle.md`](./02_Fonctionnalites/05_Interface_Collaboration/01_Messagerie_Contextuelle.md) : Messagerie liée aux événements.
  - [`02_Partage_Documents_Liens.md`](./02_Fonctionnalites/05_Interface_Collaboration/02_Partage_Documents_Liens.md) : Partage de documents.
  - [`03_Forum_Discussion.md`](./02_Fonctionnalites/05_Interface_Collaboration/03_Forum_Discussion.md) : Forum de discussion.
- **`02_Fonctionnalites/06_Analytics/`**
  - [`01_Tableau_Bord_Statistiques.md`](./02_Fonctionnalites/06_Analytics/01_Tableau_Bord_Statistiques.md) : Tableaux de bord analytiques et statistiques.
  - [`02_Rapports_Export.md`](./02_Fonctionnalites/06_Analytics/02_Rapports_Export.md) : Génération de rapports et exports.
  - [`03_Indicateurs_Performance_KPI.md`](./02_Fonctionnalites/06_Analytics/03_Indicateurs_Performance_KPI.md) : Suivi des KPIs.
- **`02_Fonctionnalites/07_Gestion_Affectations/`**
  - [`01_Types_Affectations.md`](./02_Fonctionnalites/07_Gestion_Affectations/01_Types_Affectations.md) : Définition et gestion des types d'activités/affectations.
  - [`02_Structure_Geographique.md`](./02_Fonctionnalites/07_Gestion_Affectations/02_Structure_Geographique.md) : Modélisation des sites, départements, lieux.
  - [`03_Trame_Chirurgiens.md`](./02_Fonctionnalites/07_Gestion_Affectations/03_Trame_Chirurgiens.md) : Gestion de la trame des chirurgiens.
- **`02_Fonctionnalites/08_Echanges_Affectations/`**
  - [`01_Processus_Echange.md`](./02_Fonctionnalites/08_Echanges_Affectations/01_Processus_Echange.md) : Processus d'échange d'affectations entre utilisateurs.
- **`02_Fonctionnalites/09_Compteurs_Suivi_Temps/`**
  - [`01_Compteur_Horaire_MAR.md`](./02_Fonctionnalites/09_Compteurs_Suivi_Temps/01_Compteur_Horaire_MAR.md) : Suivi du temps de travail et compteurs spécifiques.
- **`02_Fonctionnalites/10_Gestion_Temps_Partiels/`**
  - [`01_Principes_Impacts.md`](./02_Fonctionnalites/10_Gestion_Temps_Partiels/01_Principes_Impacts.md) : Gestion des utilisateurs à temps partiel.
- **`02_Fonctionnalites/11_Requetes_Personnelles/`**
  - [`01_Soumission_Traitement.md`](./02_Fonctionnalites/11_Requetes_Personnelles/01_Soumission_Traitement.md) : Gestion des demandes diverses des utilisateurs.
- **`02_Fonctionnalites/12_Notifications_Alertes/`**
  - [`01_Systeme_Notifications.md`](./02_Fonctionnalites/12_Notifications_Alertes/01_Systeme_Notifications.md) : Système de notifications et d'alertes.
- **`02_Fonctionnalites/13_Gestion_Competences/`**
  - [`01_Definition_Assignation.md`](./02_Fonctionnalites/13_Gestion_Competences/01_Definition_Assignation.md) : Définition et assignation des compétences et spécialités.
- **`02_Fonctionnalites/14_Communication_Interne/`**
  - [`01_Fonctionnalites_Communication.md`](./02_Fonctionnalites/14_Communication_Interne/01_Fonctionnalites_Communication.md) : Outils de communication interne (vision).
- **`02_Fonctionnalites/15_Gestion_Remplacements/`**
  - [`01_Processus_Remplacement.md`](./02_Fonctionnalites/15_Gestion_Remplacements/01_Processus_Remplacement.md) : Processus de gestion des remplacements.
- **`02_Fonctionnalites/16_Historisation_Audit/`**
  - [`01_Journal_Activite_Historique.md`](./02_Fonctionnalites/16_Historisation_Audit/01_Journal_Activite_Historique.md) : Journal d'activité et audit log.
- **`02_Fonctionnalites/17_Imports_Exports/`**
  - [`01_Principes_Generaux.md`](./02_Fonctionnalites/17_Imports_Exports/01_Principes_Generaux.md) : Principes généraux pour l'import et l'export de données.
- *(Fichier restant à la racine de 02_Fonctionnalites : `17_Exports_Impressions.md` - à fusionner ou supprimer).*

### 3. Considérations Techniques et Qualité
- [`03_Considerations_Techniques_Qualite/01_Performance.md`](./03_Considerations_Techniques_Qualite/01_Performance.md) : Performance applicative.
- [`03_Considerations_Techniques_Qualite/02_Securite.md`](./03_Considerations_Techniques_Qualite/02_Securite.md) : Sécurité applicative.
- [`03_Considerations_Techniques_Qualite/03_Logging_Monitoring_Alerting.md`](./03_Considerations_Techniques_Qualite/03_Logging_Monitoring_Alerting.md) : Logging, monitoring et alerting.
- [`03_Considerations_Techniques_Qualite/04_Disponibilite_Scalabilite.md`](./03_Considerations_Techniques_Qualite/04_Disponibilite_Scalabilite.md) : Disponibilité et scalabilité.
- [`03_Considerations_Techniques_Qualite/05_Maintenabilite_Qualite_Code.md`](./03_Considerations_Techniques_Qualite/05_Maintenabilite_Qualite_Code.md) : Maintenabilité et qualité du code.
- [`03_Considerations_Techniques_Qualite/06_Ergonomie_Accessibilite_Compatibilite.md`](./03_Considerations_Techniques_Qualite/06_Ergonomie_Accessibilite_Compatibilite.md) : Ergonomie, accessibilité et compatibilité.
- [`03_Considerations_Techniques_Qualite/07_Adaptabilite_Configurabilite.md`](./03_Considerations_Techniques_Qualite/07_Adaptabilite_Configurabilite.md) : Adaptabilité et configurabilité.
- [`03_Considerations_Techniques_Qualite/08_Capacite_Hors_Ligne_PWA.md`](./03_Considerations_Techniques_Qualite/08_Capacite_Hors_Ligne_PWA.md) : Capacité hors-ligne (PWA).

### 4. Roadmap
- [`04_Roadmap/01_Phases_Priorites.md`](./04_Roadmap/01_Phases_Priorites.md) : Phases et priorités de développement.
  *(Fichier manquant : `04_Roadmap/02_Plan_Implementation.md`)*

### 5. Annexes
  *(Aucun fichier actuellement dans cette section. Fichiers prévus : `01_Glossaire.md`, `02_References.md`)*

## État de la Documentation

Cette documentation est un travail en cours. L'objectif est de la rendre la plus complète et à jour possible pour servir de référence unique pour le projet Mathildanesth. Des sections ou fichiers peuvent encore nécessiter des compléments, des révisions ou des créations.

Les prochaines étapes incluront :
- La revue et la consolidation du contenu de la section `01_Architecture_Generale`.
- La création ou le complètement des fichiers marqués comme manquants ou à compléter.
- La création des annexes (Glossaire, Références).
- L'ajout de diagrammes (architecture, flux, modèles de données).
- La relecture générale pour la cohérence et la clarté.

## Origine de la Consolidation

Cette documentation est le résultat de la fusion de deux sources principales :
1. Le projet **mathildanesth** - Application existante avec plusieurs modules fonctionnels
2. Le projet **MATHILDA** - Conception documentaire détaillée pour une architecture alternative

L'objectif est de capitaliser sur les forces des deux approches :
- L'implémentation concrète et les fonctionnalités développées dans mathildanesth
- L'architecture claire et la documentation structurée de MATHILDA

## Prochaines étapes de la documentation

1. Compléter les sections manquantes, en particulier sur l'algorithme de génération de planning
2. Documenter les interfaces utilisateur avec captures d'écran
3. Ajouter des diagrammes d'architecture et de flux de données
4. Développer les guides de contribution pour nouveaux développeurs 