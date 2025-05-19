# Gestion des Imports et Exports

## 1. Introduction

Pour faciliter l'intégration avec d'autres systèmes d'information hospitaliers (SIH), permettre la manipulation de données en masse, et offrir des options de sauvegarde ou de partage, Mathildanesth propose diverses fonctionnalités d'import et d'export de données.

Cette section s'inspire des spécifications initiales du projet `MATHILDA` et intègre les fonctionnalités effectivement présentes ou en cours de développement dans Mathildanesth.

## 2. Exports de Données

Mathildanesth permet d'exporter différentes catégories de données, souvent dans plusieurs formats.

### 2.1. Export du Planning

- **Objectif** : Permettre aux utilisateurs de visualiser leur planning hors ligne, de l'intégrer à des calendriers personnels, ou de partager des vues spécifiques.
- **Fonctionnalités Existantes/Prévues** :
    - Le module Calendrier (`src/pages/api/calendar/export.ts`) permet d'exporter des événements de calendrier (affectations, congés) aux formats PDF, Excel (XLSX), CSV, et iCalendar (.ics).
    - Les options d'export incluent généralement le choix de la période, des utilisateurs/ressources, et du niveau de détail.
- **Accès** : Typiquement, les utilisateurs peuvent exporter leur planning personnel, tandis que les planificateurs/administrateurs peuvent exporter des vues plus globales.

### 2.2. Export des Données de Congés et Quotas

- **Objectif** : Fournir des extraits pour le suivi RH, la paie, ou des analyses spécifiques.
- **Fonctionnalités Existantes/Prévues** :
    - Le module de gestion des congés (`src/modules/leaves/`) offre plusieurs points d'export :
        - Export des soldes de congés (`leaveBalanceService.ts` via `/api/leave-balances/export`).
        - Export des demandes de congés (`leaveRequestService.ts` via `/api/leave-requests/export`).
        - Export des transferts de quotas (`/api/leaves/quotas/transfers/export/route.ts`).
    - Les formats courants sont CSV et Excel.
- **Accès** : Principalement les administrateurs et managers pour les données agrégées ; les utilisateurs pour leurs données personnelles.

### 2.3. Export des Compteurs Utilisateurs et Données Analytiques

- **Objectif** : Permettre l'analyse de l'équité, de la charge de travail, et d'autres indicateurs de performance.
- **Fonctionnalités Existantes/Prévues** :
    - La section `06_Analytics/02_Rapports_Export.md` détaille les exports de rapports.
    - Le module `LeaveAnalyticsService` (`src/modules/dashboard/leaves/services/leaveAnalyticsService.ts`) permet d'exporter des données analytiques sur les congés au format CSV.
- **Accès** : Administrateurs et managers.

### 2.4. Export des Utilisateurs

- **Objectif** : Extraire la liste du personnel pour des besoins administratifs.
- **Fonctionnalités Prévues (basé sur `docs MATHILDA`)** :
    - Format CSV.
    - Contenu : Informations principales (nom, prénom, email, rôle, temps de travail).
- **Accès** : Administrateurs.
- *Note : À vérifier si une API spécifique existe déjà dans Mathildanesth.*

## 3. Imports de Données

L'import de données est une fonctionnalité plus sensible, nécessitant des validations robustes.

### 3.1. Import de la Trame Chirurgien / Affectations de Planning

- **Objectif** : Faciliter la saisie initiale ou la mise à jour en masse de l'occupation des salles par les chirurgiens, ou plus généralement des affectations.
- **Fonctionnalités Existantes/Prévues** :
    - Le code de la page du planning hebdomadaire (`dist/src/app/planning/hebdomadaire/fixed-page.jsx`, et une version `.old` dans le même dossier) contient une logique (`handleImportFile`) pour parser un fichier CSV contenant des affectations (Date, Salle, Créneau, Chirurgien, MAR, IADE).
    - `docs MATHILDA` mentionnait une API `POST /api/v1/io/import/surgeon-schedule` pour l'import de la trame chirurgien (CSV/Excel).
- **Format Attendu** : CSV, avec des colonnes clairement définies (ex: Date, ID/Nom Salle, ID/Nom Utilisateur, Rôle, Période).
- **Validation** : Essentielle pour vérifier la cohérence des données (dates valides, utilisateurs/salles existants, pas de conflits majeurs).
- **Accès** : Planificateurs, administrateurs.

### 3.2. Import des Absences/Congés

- **Objectif** : Intégrer des données d'absences provenant d'un système RH externe.
- **Fonctionnalités Prévues (basé sur `docs MATHILDA`)** :
    - Format CSV.
    - Contenu : Utilisateur, dates, type d'absence, motif.
- **Accès** : Administrateurs.
- *Note : Nécessiterait une API et une logique de traitement spécifiques pour créer les enregistrements `Leave` ou `PlannedAbsence` correspondants.*

### 3.3. Import Initial des Utilisateurs

- **Objectif** : Faciliter la configuration initiale de l'application avec un grand nombre d'utilisateurs.
- **Fonctionnalités Prévues (basé sur `docs MATHILDA`)** :
    - Format CSV.
    - `docs MATHILDA` mentionnait une API `POST /api/v1/io/import/users`.
- **Accès** : Super Administrateurs.
- *Note : À vérifier si une API spécifique existe déjà dans Mathildanesth.*

## 4. Considérations Techniques Générales

- **API Dédiées** : Les imports et exports doivent être gérés par des endpoints API spécifiques et sécurisés.
- **Validation des Données (Imports)** :
    - Vérification du format du fichier.
    - Validation du contenu de chaque ligne (types de données, existence des entités liées, respect des contraintes métier de base).
    - Génération d'un rapport d'import clair indiquant les succès, les erreurs (avec numéro de ligne et message), et les avertissements.
- **Traitement Asynchrone** : Pour les fichiers volumineux, les opérations d'import/export devraient être traitées comme des tâches en arrière-plan pour ne pas impacter les performances de l'interface utilisateur et éviter les timeouts. L'utilisateur pourrait être notifié une fois le traitement terminé.
- **Permissions** : Des droits d'accès fins doivent contrôler qui peut importer ou exporter quelles données.
- **Prévisualisation (Imports)** : Idéalement, proposer une étape de prévisualisation avant l'import définitif pour permettre à l'utilisateur de vérifier l'interprétation des données.
- **Templates (Imports)** : Fournir des modèles CSV/Excel téléchargeables pour guider les utilisateurs sur le format attendu.

---

La mise en place de fonctionnalités d'import et d'export robustes et conviviales est un facteur clé pour l'adoption et l'intégration de Mathildanesth dans l'écosystème applicatif d'un établissement de santé. 