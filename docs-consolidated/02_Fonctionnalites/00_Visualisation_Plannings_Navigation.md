# Visualisation des Plannings et Navigation Générale

## 1. Introduction

Mathildanesth offre une interface utilisateur intuitive et plusieurs vues de planning pour permettre aux utilisateurs de consulter, gérer et comprendre facilement les affectations et les horaires. Ce document décrit les principales fonctionnalités de navigation et les différentes manières de visualiser les plannings.

## 2. Navigation Principale

L'application est structurée autour d'une navigation principale claire, généralement accessible via une barre latérale ou un menu supérieur, permettant d'accéder rapidement aux différentes sections :

- **Tableau de Bord (Dashboard)** : Vue d'ensemble personnalisée avec des indicateurs clés et des accès rapides.
- **Planning Global / Calendrier Principal** : Vue principale pour la consultation des plannings individuels, d'équipe ou par service.
- **Planning Hebdomadaire** : Vue détaillée du planning sur une semaine, souvent utilisée pour la gestion fine des affectations et la visualisation des postes.
- **Planning du Bloc Opératoire** : Section dédiée à la planification spécifique des salles et secteurs du bloc opératoire.
- **Gestion des Congés et Absences** : Interface pour la soumission, la consultation et la validation des congés.
- **Profil Utilisateur** : Accès aux informations personnelles, préférences et paramètres spécifiques à l'utilisateur.
- **Paramètres / Administration** : Sections réservées aux administrateurs pour la configuration du système (utilisateurs, rôles, types de congés, règles, trames, etc.).
- **Statistiques et Rapports** : Module pour l'analyse de données et la génération de rapports.
- **Notifications** : Centre de notifications pour les alertes et messages importants.

La navigation est conçue pour être cohérente à travers l'application, avec des éléments récurrents comme les fils d'Ariane pour faciliter l'orientation.

## 3. Vues de Planning Principales

### 3.1. Vue Calendrier Principal (`src/app/calendar/`)

Cette vue est souvent le point d'entrée pour la consultation des plannings.

- **Affichages Multiples** :
  - **Mois** : Vue mensuelle pour une vision globale des affectations sur le long terme.
  - **Semaine** : Vue hebdomadaire détaillée.
  - **Jour** : Vue journalière pour un focus précis.
  - **Liste/Agenda** : Affichage chronologique des événements et affectations.
- **Navigation Temporelle** : Boutons "Précédent", "Suivant", "Aujourd'hui" et un sélecteur de date (`DatePicker`) pour naviguer facilement entre les périodes.
- **Filtrage et Personnalisation** :
  - Filtres par utilisateur, équipe, service, type d'affectation (garde, astreinte, consultation, congé, etc.).
  - Options pour afficher/masquer certains types d'événements.
  - Possibilité de sauvegarder des préférences d'affichage.
- **Interactions** :
  - Survol pour afficher des détails rapides d'une affectation.
  - Clic pour ouvrir une modale ou une page avec les détails complets et les actions possibles (modifier, échanger, annuler - selon les droits).
- **Responsive Design** : La vue calendrier est conçue pour s'adapter aux différentes tailles d'écran, des ordinateurs de bureau aux tablettes.

### 3.2. Vue Planning Hebdomadaire (`src/app/planning/hebdomadaire/`)

Cette vue est spécifiquement optimisée pour la gestion et la visualisation détaillée du planning sur une semaine. Elle est souvent utilisée par les planificateurs.

- **Structure en Grille** : Affiche typiquement les jours de la semaine en colonnes et les utilisateurs, les postes ou les salles (pour le bloc opératoire) en lignes.
- **Affichage des Affectations** : Les affectations (gardes, astreintes, congés, etc.) sont représentées par des blocs colorés ou des icônes dans la grille.
- **Drag-and-Drop (Glisser-Déposer)** : Si implémenté, cette fonctionnalité permet de modifier facilement les affectations en les déplaçant dans la grille.
- **Indicateurs Visuels** :
  - Couleurs distinctes pour différents types d'affectations.
  - Indicateurs de conflits ou de violations de règles.
  - Affichage des heures de début et de fin.
- **Actions Rapides** : Possibilité d'ajouter, modifier ou supprimer des affectations directement depuis la grille (selon les permissions).
- **Zoom et Défilement** : Options pour ajuster le niveau de détail et naviguer sur des plannings complexes.

### 3.3. Planning du Bloc Opératoire (`src/app/bloc-operatoire/planning/`)

Vue spécialisée pour les besoins du bloc opératoire.

- **Affichage par Salle/Secteur** : Organise le planning autour des salles d'opération et des secteurs.
- **Visualisation des Interventions** : Affiche les interventions planifiées, les chirurgiens assignés, les types d'anesthésie, etc.
- **Gestion des Ressources** : Peut inclure la visualisation de la disponibilité du matériel ou du personnel spécifique au bloc.
- **Règles de Supervision** : Des indicateurs peuvent signaler le respect ou la violation des règles de supervision.

## 4. Navigation Contextuelle et Actions

En plus de la navigation principale, l'application utilise des éléments de navigation contextuelle :

- **Boutons d'Action** : Présents sur les listes, les formulaires et les vues de détail pour effectuer des opérations spécifiques (ex: "Ajouter un congé", "Modifier l'utilisateur", "Générer le planning").
- **Menus Contextuels** : Peuvent apparaître sur un clic droit ou via une icône "options" pour proposer des actions relatives à un élément spécifique.
- **Liens Internes** : Navigation entre les entités liées (ex: depuis un utilisateur vers ses affectations, depuis une affectation vers les détails du poste).

## 5. Personnalisation de l'Affichage

Mathildanesth vise à offrir une expérience personnalisable :

- **Préférences Utilisateur** : Possibilité de sauvegarder les filtres par défaut, la vue de planning préférée, etc.
- **Thème (Clair/Sombre)** : L'application supporte un thème clair et un thème sombre pour le confort visuel.
- **Affichage des Données** : Options pour choisir les colonnes à afficher dans les tableaux, le niveau de détail dans les calendriers.

## 6. Recherche

Une fonctionnalité de recherche globale ou contextuelle peut être disponible pour retrouver rapidement des utilisateurs, des affectations, des règles, etc.

---

Ce document fournit un aperçu des fonctionnalités de visualisation et de navigation. Des détails plus spécifiques à chaque module fonctionnel (congés, bloc opératoire, etc.) seront décrits dans leurs sections respectives.
