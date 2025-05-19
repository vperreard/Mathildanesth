# Gestion des Imports, Exports et Impressions

## 1. Introduction

Pour faciliter l'intégration avec d'autres systèmes d'information hospitaliers (SIH), permettre la manipulation de données en masse, offrir des options de sauvegarde ou de partage, et pour la consultation hors ligne, Mathildanesth propose diverses fonctionnalités d'import, d'export de données et d'impression.

Cette section s'inspire des spécifications initiales du projet `MATHILDA` et intègre les fonctionnalités existantes ou prévues dans Mathildanesth, en lien avec la roadmap (`documentation/roadmap-dev-updated.md`) qui mentionne notamment l'"exportation des trames" (Phase 1) et l'export de calendrier (`src/pages/api/calendar/export.ts`).

## 2. Objectifs Généraux

- **Interopérabilité** : Permettre à Mathildanesth de communiquer avec d'autres outils (RH, paie, SIH).
- **Flexibilité de Gestion** : Offrir aux utilisateurs des moyens de manipuler leurs données en dehors de l'application pour des besoins spécifiques.
- **Partage d'Informations** : Faciliter la diffusion de plannings ou de rapports à des personnes n'ayant pas accès directement à Mathildanesth.
- **Reporting et Analyse Externe** : Exporter des données pour des analyses poussées.
- **Archivage** : Conserver des copies des informations importantes.
- **Consultation Hors Ligne** : Permettre l'impression de vues pour affichage ou consultation sans accès à l'application.

## 3. Imports de Données

L'import de données est une fonctionnalité puissante mais sensible, nécessitant des validations robustes.

### 3.1. Import de la Trame Chirurgien / Affectations de Planning
- **Objectif** : Faciliter la saisie initiale ou la mise à jour en masse de l'occupation des salles par les chirurgiens, ou plus généralement des affectations du personnel.
- **Fonctionnalités Existantes/Prévues** :
    - Le code de la page du planning hebdomadaire (`dist/src/app/planning/hebdomadaire/fixed-page.jsx` et `.old`) contient une logique (`handleImportFile`) pour parser un fichier CSV d'affectations (Date, Salle, Créneau, Chirurgien, MAR, IADE).
    - `docs MATHILDA` mentionnait une API `POST /api/v1/io/import/surgeon-schedule` pour la trame chirurgien (CSV/Excel).
- **Accès** : Planificateurs, administrateurs.

### 3.2. Import des Absences/Congés
- **Objectif** : Intégrer des données d'absences provenant d'un système RH externe.
- **Fonctionnalités Prévues (basé sur `docs MATHILDA`)** : Format CSV (Utilisateur, dates, type, motif).
- **Accès** : Administrateurs.

### 3.3. Import Initial des Utilisateurs
- **Objectif** : Faciliter la configuration initiale de l'application.
- **Fonctionnalités Prévues (basé sur `docs MATHILDA`)** : Format CSV, API `POST /api/v1/io/import/users`.
- **Accès** : Super Administrateurs.

## 4. Exports de Données

Mathildanesth permet d'exporter différentes catégories de données.

### 4.1. Export des Plannings (Général, Équipe, Individuel, Bloc)
- **Formats** : PDF (visualisation fidèle), CSV/Excel (manipulation de données), iCalendar (.ics, via `src/pages/api/calendar/export.ts` pour intégration dans des calendriers externes).
- **Contenu Typique (CSV/Excel)** : Date, Utilisateur, Type d'affectation, Heures, Salle/Lieu, Notes.
- **Options** : Période, filtres (service, rôle, utilisateur), choix des colonnes (pour CSV/Excel).

### 4.2. Export des Trames de Planning
- **Fonctionnalité Prévue** : Roadmap (`documentation/roadmap-dev-updated.md`).
- **Formats** : JSON/XML (réimportation/outils), PDF/CSV (documentation).

### 4.3. Export des Données Utilisateurs et Profils
- **Usage** : Besoins administratifs, reporting RH.
- **Formats** : CSV/Excel.
- **Attention RGPD** : Accès strictement contrôlé.

### 4.4. Export des Données de Congés et Quotas
- **Fonctionnalités Existantes** : Exports pour soldes (`leaveBalanceService.ts`), demandes (`leaveRequestService.ts`), transferts de quotas (`/api/leaves/quotas/transfers/export/route.ts`).
- **Formats** : CSV/Excel.

### 4.5. Export des Données pour Rapports et Analyses
- **Objectif** : Alimenter des analyses externes ou des rapports formalisés.
- **Référence** : Les types de rapports et les données exportables sont décrits plus en détail dans la section [06_Analytics/02_Rapports_Export.md](./../06_Analytics/02_Rapports_Export.md).
- **Exemple Existant** : `LeaveAnalyticsService` (`src/modules/dashboard/leaves/services/leaveAnalyticsService.ts`) exporte des données analytiques sur les congés en CSV.

## 5. Fonctionnalités d'Impression

- **Impression Directe depuis le Navigateur** : Les vues de planning doivent être "imprimables" via la fonction du navigateur, en utilisant des CSS spécifiques (`@media print`) pour optimiser la mise en page.
- **Bouton "Imprimer" Dédié** : Pour les vues clés, un bouton pourrait déclencher une version optimisée pour l'impression ou générer un PDF à la volée.
- **Options d'Impression** : Orientation, échelle, sélection des informations.

## 6. Interface Utilisateur pour Imports/Exports/Impressions

- **Boutons d'Action Clairs** : Visibles sur les vues concernées.
- **Modales de Configuration** : Pour les options d'export/import (format, période, filtres, colonnes).
- **Feedback Utilisateur** : Indication du statut de l'opération (en cours, terminé, erreurs) et accès facile aux fichiers générés.
- **Templates (Imports)** : Fournir des modèles CSV/Excel téléchargeables.

## 7. Considérations Techniques Générales

- **API Dédiées et Sécurisées** pour toutes les opérations d'import/export.
- **Validation Robuste des Données (Imports)** :
    - Format du fichier, contenu de chaque ligne, existence des entités liées, respect des contraintes.
    - Rapport d'import détaillé (succès, erreurs, avertissements).
- **Traitement Asynchrone** : Pour les fichiers volumineux, afin de ne pas impacter les performances et éviter les timeouts. Notification à l'utilisateur à la fin.
- **Permissions Fines** : Contrôler qui peut importer/exporter/imprimer quelles données.
- **Prévisualisation (Imports)** : Si possible, avant import définitif.
- **Génération PDF (Serveur ou Client)** :
    - Côté serveur (ex: Puppeteer) : Meilleur contrôle, plus de charge serveur.
    - Côté client (ex: jsPDF) : Moins de charge serveur, limitations possibles.
- **Génération CSV/Excel** : Côté client pour volumes raisonnables, sinon côté serveur.

---

Des fonctionnalités d'import, d'export et d'impression robustes et conviviales sont des facteurs clés pour l'adoption et l'intégration de Mathildanesth dans l'écosystème applicatif d'un établissement de santé. 